import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BUILDINGS, GRID_COLS, GRID_ROWS, hasAdjacentRoadFootprint, canPlaceAt, getBuildingSize } from "@/lib/gameConfig";
import {
  TILE_SIZE,
  GRID_OFFSET_X,
  GRID_OFFSET_Z,
  BUILDING_HEIGHTS,
  createBuildingMesh,
  disposeBuildingMesh,
  tileToWorld,
} from "@/lib/buildingFactory";
import {
  createEmptyRoadData,
  addNode,
  addSegment,
  updateNodePosition,
  removeSegment,
  snapToAngle,
  buildSegmentCurve,
  generateRoadMeshes,
  generateNodeMeshes,
  findNearestSegment,
  ROAD_TYPES,
} from "@/lib/roadNetwork";

export default function CityGrid3D({
  grid,
  selectedTool,
  onTileClick,
  money,
  mode,
  roadData,
  roadType,
  roadMode,
  roadAction,
  onRoadChange,
  finishPathCounter,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingMeshesRef = useRef({});
  const roadGroupRef = useRef(null);
  const nodeGroupRef = useRef(null);
  const ghostRef = useRef(null);
  const groundRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2(-10, -10));
  const [isReady, setIsReady] = useState(false);

  // Road interaction state
  const roadDataRef = useRef(roadData);
  const roadStateRef = useRef({ currentNodeIds: [], draggingNodeId: null });
  const previewRef = useRef(null);
  const currentNodeIdsRef = useRef([]);

  useEffect(() => {
    roadDataRef.current = roadData;
  }, [roadData]);

  // Initialize three.js scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2a3a);
    scene.fog = new THREE.Fog(0x1a2a3a, 150, 500);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(100, 120, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 10;
    controls.maxDistance = 450;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(80, 140, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -160;
    dirLight.shadow.camera.right = 160;
    dirLight.shadow.camera.top = 160;
    dirLight.shadow.camera.bottom = -160;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 400;
    scene.add(dirLight);
    scene.add(new THREE.HemisphereLight(0x87ceeb, 0x2a4a2a, 0.4));

    const groundW = GRID_COLS * TILE_SIZE;
    const groundH = GRID_ROWS * TILE_SIZE;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundW, groundH),
      new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    groundRef.current = ground;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(
      Math.max(groundW, groundH),
      Math.max(GRID_COLS, GRID_ROWS),
      0x445566,
      0x334455
    );
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Ghost preview for buildings
    const ghost = new THREE.Mesh(
      new THREE.BoxGeometry(TILE_SIZE, 1, TILE_SIZE),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.35 })
    );
    ghost.visible = false;
    ghostRef.current = ghost;
    scene.add(ghost);

    // Road preview — a thin ribbon mesh (Line linewidth doesn't work in WebGL)
    const previewGroup = new THREE.Group();
    previewGroup.visible = false;
    previewRef.current = previewGroup;
    scene.add(previewGroup);

    setIsReady(true);

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (m.map && typeof m.map.dispose === "function") m.map.dispose();
            m.dispose();
          });
        }
      });
    };
  }, []);

  // Building meshes (skip roads — handled by spline system)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !isReady) return;

    Object.values(buildingMeshesRef.current).forEach((group) => {
      scene.remove(group);
      disposeBuildingMesh(group);
    });
    buildingMeshesRef.current = {};

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = grid[r][c];
        if (!cell || cell.occ) continue;
        if (!cell.id) continue;
        // Skip grid-based roads in the building loop (spline roads are separate)
        if (cell.id === "road" || cell.id.startsWith("road_")) continue;

        const building = BUILDINGS[cell.id];
        if (!building) continue;

        const size = cell.s || getBuildingSize(cell.id);
        const height = BUILDING_HEIGHTS[cell.id] || 1;
        const group = createBuildingMesh(cell.id, building, height, size);
        const { x, z } = tileToWorld(r, c, size);
        group.position.set(x, 0, z);
        scene.add(group);
        buildingMeshesRef.current[`${r}-${c}`] = group;
      }
    }
  }, [grid, isReady]);

  // Road + node meshes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !isReady) return;

    if (roadGroupRef.current) {
      scene.remove(roadGroupRef.current);
      disposeBuildingMesh(roadGroupRef.current);
    }
    if (nodeGroupRef.current) {
      scene.remove(nodeGroupRef.current);
      disposeBuildingMesh(nodeGroupRef.current);
    }

    roadGroupRef.current = generateRoadMeshes(roadData);
    scene.add(roadGroupRef.current);

    if (mode === "road") {
      nodeGroupRef.current = generateNodeMeshes(roadData, currentNodeIdsRef.current);
      scene.add(nodeGroupRef.current);
    }
  }, [roadData, isReady, mode]);

  // Interaction
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !sceneRef.current) return;

    const getMouseWorld = (event) => {
      const rect = mount.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
      const hits = raycasterRef.current.intersectObject(groundRef.current);
      if (hits.length > 0) return { x: hits[0].point.x, z: hits[0].point.z };
      return null;
    };

    const findNearbyNode = (x, z, threshold = 1.8) => {
      const data = roadDataRef.current;
      let nearest = null;
      let minDist = threshold;
      for (const node of data.nodes) {
        const d = Math.sqrt((node.x - x) ** 2 + (node.z - z) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = node;
        }
      }
      return nearest;
    };

    const updatePreview = (x, z) => {
      const preview = previewRef.current;
      const state = roadStateRef.current;
      const data = roadDataRef.current;
      if (!preview || state.currentNodeIds.length === 0) {
        if (preview) preview.visible = false;
        return;
      }
      const lastNode = data.nodes.find((n) => n.id === state.currentNodeIds[state.currentNodeIds.length - 1]);
      if (!lastNode) {
        preview.visible = false;
        return;
      }
      let endX = x, endZ = z;
      if (roadMode === "straight") {
        const snapped = snapToAngle(lastNode.x, lastNode.z, x, z);
        endX = snapped.x;
        endZ = snapped.z;
      }
      const start = new THREE.Vector3(lastNode.x, 0, lastNode.z);
      const end = new THREE.Vector3(endX, 0, endZ);
      const curve =
        roadMode === "curved"
          ? new THREE.CubicBezierCurve3(
              start,
              start.clone().lerp(end, 0.3),
              start.clone().lerp(end, 0.7),
              end
            )
          : new THREE.LineCurve3(start, end);

      // Clear old preview meshes
      while (preview.children.length > 0) {
        const child = preview.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        preview.remove(child);
      }

      // Build a visible ribbon preview
      const rt = ROAD_TYPES[roadType];
      const previewWidth = rt ? rt.width : 4;
      const segs = Math.max(16, Math.floor(curve.getLength() / 0.25));
      const pts = curve.getSpacedPoints(segs);
      const normals = [];
      for (let i = 0; i < pts.length; i++) {
        let tan;
        if (i === 0) tan = pts[1].clone().sub(pts[0]);
        else if (i === pts.length - 1) tan = pts[i].clone().sub(pts[i - 1]);
        else tan = pts[i + 1].clone().sub(pts[i - 1]);
        tan.y = 0;
        tan.normalize();
        normals.push(new THREE.Vector3(-tan.z, 0, tan.x));
      }
      const halfW = previewWidth / 2;
      const positions = [];
      const indices = [];
      for (let i = 0; i < pts.length; i++) {
        const left = pts[i].clone().add(normals[i].clone().multiplyScalar(halfW));
        const right = pts[i].clone().sub(normals[i].clone().multiplyScalar(halfW));
        positions.push(left.x, 0.08, left.z, right.x, 0.08, right.z);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      preview.add(new THREE.Mesh(geo, mat));
      preview.visible = true;
    };

    // ---- Road mode handlers ----
    const onRoadMouseDown = (event) => {
      if (event.button !== 0) return;
      const world = getMouseWorld(event);
      if (!world) return;

      // Delete mode
      if (roadAction === "delete") {
        const seg = findNearestSegment(roadDataRef.current, world.x, world.z, 4);
        if (seg) onRoadChange(removeSegment(roadDataRef.current, seg.id));
        return;
      }

      const existingNode = findNearbyNode(world.x, world.z);
      const state = roadStateRef.current;

      if (existingNode) {
        if (state.currentNodeIds.length === 0) {
          state.currentNodeIds.push(existingNode.id);
          currentNodeIdsRef.current = [...state.currentNodeIds];
        } else {
          const lastId = state.currentNodeIds[state.currentNodeIds.length - 1];
          if (existingNode.id !== lastId) {
            let data = roadDataRef.current;
            data = addSegment(data, lastId, existingNode.id, roadType, roadMode === "curved");
            onRoadChange(data);
            state.currentNodeIds.push(existingNode.id);
            currentNodeIdsRef.current = [...state.currentNodeIds];
          }
        }
        state.draggingNodeId = existingNode.id;
      } else {
        let data = roadDataRef.current;
        let pos = { x: world.x, z: world.z };
        if (state.currentNodeIds.length > 0 && roadMode === "straight") {
          const lastNode = data.nodes.find((n) => n.id === state.currentNodeIds[state.currentNodeIds.length - 1]);
          if (lastNode) pos = snapToAngle(lastNode.x, lastNode.z, world.x, world.z);
        }
        data = addNode(data, pos.x, pos.z);
        const newNode = data.nodes[data.nodes.length - 1];
        if (state.currentNodeIds.length > 0) {
          const lastNodeId = state.currentNodeIds[state.currentNodeIds.length - 1];
          data = addSegment(data, lastNodeId, newNode.id, roadType, roadMode === "curved");
        }
        state.currentNodeIds.push(newNode.id);
        currentNodeIdsRef.current = [...state.currentNodeIds];
        onRoadChange(data);
      }
      // Rebuild node meshes to show active state
      if (nodeGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(nodeGroupRef.current);
        disposeBuildingMesh(nodeGroupRef.current);
        nodeGroupRef.current = generateNodeMeshes(roadDataRef.current, currentNodeIdsRef.current);
        sceneRef.current.add(nodeGroupRef.current);
      }
    };

    const onRoadMouseMove = (event) => {
      const world = getMouseWorld(event);
      if (!world) return;
      const state = roadStateRef.current;

      if (state.draggingNodeId) {
        const data = updateNodePosition(roadDataRef.current, state.draggingNodeId, world.x, world.z);
        onRoadChange(data);
      } else {
        updatePreview(world.x, world.z);
      }
    };

    const onRoadMouseUp = () => {
      roadStateRef.current.draggingNodeId = null;
    };

    const onRoadDoubleClick = () => {
      roadStateRef.current.currentNodeIds = [];
      currentNodeIdsRef.current = [];
      if (previewRef.current) previewRef.current.visible = false;
      if (nodeGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(nodeGroupRef.current);
        disposeBuildingMesh(nodeGroupRef.current);
        nodeGroupRef.current = generateNodeMeshes(roadDataRef.current, []);
        sceneRef.current.add(nodeGroupRef.current);
      }
    };

    // ---- Build mode handlers ----
    const updateBuildHover = () => {
      const camera = cameraRef.current;
      const ground = groundRef.current;
      const raycaster = raycasterRef.current;
      const mouse = mouseRef.current;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(ground);
      if (hits.length > 0) {
        const point = hits[0].point;
        const col = Math.floor((point.x - GRID_OFFSET_X) / TILE_SIZE);
        const row = Math.floor((point.z - GRID_OFFSET_Z) / TILE_SIZE);
        if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
          updateBuildGhost(row, col);
          return;
        }
      }
      if (ghostRef.current) ghostRef.current.visible = false;
    };

    const updateBuildGhost = (row, col) => {
      const ghost = ghostRef.current;
      if (!ghost) return;
      const tool = selectedTool;
      if (tool === "demolish") {
        const { x, z } = tileToWorld(row, col, [1, 1]);
        ghost.visible = true;
        ghost.material.color.set(0xff0000);
        ghost.scale.set(1, 1, 1);
        ghost.position.set(x, 0.5, z);
      } else if (BUILDINGS[tool]) {
        const building = BUILDINGS[tool];
        const size = getBuildingSize(tool);
        const height = BUILDING_HEIGHTS[tool] || 1;
        const ghostH = Math.max(0.5, height);
        const canAfford = money >= building.cost;
        const hasSpace = canPlaceAt(grid, row, col, size);
        const { x, z } = tileToWorld(row, col, size);
        ghost.visible = true;
        ghost.material.color.set(canAfford && hasSpace ? 0x00ff00 : 0xff0000);
        ghost.scale.set(size[0], ghostH, size[1]);
        ghost.position.set(x, ghostH / 2, z);
      } else {
        ghost.visible = false;
      }
    };

    const onBuildMouseMove = (event) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      updateBuildHover();
    };

    const onBuildClick = (event) => {
      const world = getMouseWorld(event);
      if (!world) return;
      const col = Math.floor((world.x - GRID_OFFSET_X) / TILE_SIZE);
      const row = Math.floor((world.z - GRID_OFFSET_Z) / TILE_SIZE);
      if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        onTileClick(row, col);
      }
    };

    // Attach/detach based on mode
    if (mode === "road") {
      mount.addEventListener("mousedown", onRoadMouseDown);
      mount.addEventListener("mousemove", onRoadMouseMove);
      mount.addEventListener("mouseup", onRoadMouseUp);
      mount.addEventListener("dblclick", onRoadDoubleClick);
      if (ghostRef.current) ghostRef.current.visible = false;
      return () => {
        mount.removeEventListener("mousedown", onRoadMouseDown);
        mount.removeEventListener("mousemove", onRoadMouseMove);
        mount.removeEventListener("mouseup", onRoadMouseUp);
        mount.removeEventListener("dblclick", onRoadDoubleClick);
      };
    } else {
      mount.addEventListener("mousemove", onBuildMouseMove);
      mount.addEventListener("click", onBuildClick);
      if (previewRef.current) previewRef.current.visible = false;
      return () => {
        mount.removeEventListener("mousemove", onBuildMouseMove);
        mount.removeEventListener("click", onBuildClick);
      };
    }
  }, [mode, roadData, roadType, roadMode, roadAction, grid, selectedTool, money, onTileClick, onRoadChange, isReady]);

  // Finish path when switching away from road mode or when Finish Path is clicked
  useEffect(() => {
    if (mode !== "road") {
      roadStateRef.current.currentNodeIds = [];
      currentNodeIdsRef.current = [];
      if (previewRef.current) previewRef.current.visible = false;
    }
  }, [mode]);

  useEffect(() => {
    if (finishPathCounter > 0) {
      roadStateRef.current.currentNodeIds = [];
      currentNodeIdsRef.current = [];
      if (previewRef.current) previewRef.current.visible = false;
      const scene = sceneRef.current;
      if (scene && nodeGroupRef.current) {
        scene.remove(nodeGroupRef.current);
        disposeBuildingMesh(nodeGroupRef.current);
        nodeGroupRef.current = generateNodeMeshes(roadDataRef.current, []);
        scene.add(nodeGroupRef.current);
      }
    }
  }, [finishPathCounter]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full cursor-crosshair"
        style={{ minHeight: "400px" }}
      />
      <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 bg-slate-900/60 px-2 py-1 rounded pointer-events-none">
        {mode === "road"
          ? "Click to add nodes · Drag nodes to reshape · Double-click to finish path"
          : "Drag to rotate · Scroll to zoom · Right-drag to pan"}
      </div>
    </div>
  );
}
