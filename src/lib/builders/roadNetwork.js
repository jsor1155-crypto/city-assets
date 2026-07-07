import * as THREE from "three";

// ---- Road type definitions (matching reference images) ----
export const ROAD_TYPES = {
  two_lane: {
    id: "two_lane",
    name: "Two-Lane Road",
    icon: "🛣️",
    width: 5,
    surfaceColor: 0x4a4d51,
    centerLineColor: 0xffffff,
    centerLineDashed: true,
    hasEdgeLines: true,
    edgeLineColor: 0xffffff,
    cost: 100,
  },
  highway: {
    id: "highway",
    name: "Highway",
    icon: "🛤️",
    width: 12,
    surfaceColor: 0x4a4d51,
    centerLineColor: 0xffffff,
    centerLineDashed: true,
    hasLaneLines: true,
    laneLineColor: 0xffffff,
    laneOffsets: [2.5, -2.5],
    hasEdgeGuardrails: true,
    cost: 500,
  },
  dirt: {
    id: "dirt",
    name: "Dirt Road",
    icon: "🛻",
    width: 4,
    surfaceColor: 0xc2a788,
    cost: 50,
  },
  oneway: {
    id: "oneway",
    name: "One-Way Road",
    icon: "➡️",
    width: 3.5,
    surfaceColor: 0x2e3133,
    edgeLineColor: 0xf4c20d,
    hasEdgeLines: true,
    cost: 80,
  },
};

// ---- Data model ----
export function createEmptyRoadData() {
  return { nodes: [], segments: [], _nodeCounter: 0, _segmentCounter: 0 };
}

export function serializeRoadData(data) {
  return JSON.stringify({
    nodes: data.nodes.map((n) => ({ id: n.id, x: n.x, z: n.z })),
    segments: data.segments.map((s) => ({
      id: s.id,
      startNodeId: s.startNodeId,
      endNodeId: s.endNodeId,
      roadType: s.roadType,
      curved: s.curved,
    })),
    _nodeCounter: data._nodeCounter || 0,
    _segmentCounter: data._segmentCounter || 0,
  });
}

export function deserializeRoadData(str) {
  if (!str) return createEmptyRoadData();
  try {
    const p = JSON.parse(str);
    return {
      nodes: p.nodes || [],
      segments: p.segments || [],
      _nodeCounter: p._nodeCounter || 0,
      _segmentCounter: p._segmentCounter || 0,
    };
  } catch {
    return createEmptyRoadData();
  }
}

export function addNode(data, x, z) {
  const id = `n${data._nodeCounter || 0}`;
  return {
    ...data,
    nodes: [...data.nodes, { id, x, z }],
    _nodeCounter: (data._nodeCounter || 0) + 1,
  };
}

export function addSegment(data, startNodeId, endNodeId, roadType, curved) {
  const id = `s${data._segmentCounter || 0}`;
  return {
    ...data,
    segments: [
      ...data.segments,
      { id, startNodeId, endNodeId, roadType, curved },
    ],
    _segmentCounter: (data._segmentCounter || 0) + 1,
  };
}

export function updateNodePosition(data, nodeId, x, z) {
  return {
    ...data,
    nodes: data.nodes.map((n) => (n.id === nodeId ? { ...n, x, z } : n)),
  };
}

export function removeSegment(data, segmentId) {
  const seg = data.segments.find((s) => s.id === segmentId);
  if (!seg) return data;
  const remaining = data.segments.filter((s) => s.id !== segmentId);
  // Remove orphan nodes
  const usedNodeIds = new Set();
  remaining.forEach((s) => {
    usedNodeIds.add(s.startNodeId);
    usedNodeIds.add(s.endNodeId);
  });
  return {
    ...data,
    segments: remaining,
    nodes: data.nodes.filter((n) => usedNodeIds.has(n.id)),
  };
}

// ---- Geometry helpers ----
export function snapToAngle(startX, startZ, endX, endZ) {
  const dx = endX - startX;
  const dz = endZ - startZ;
  const angle = Math.atan2(dz, dx);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const dist = Math.sqrt(dx * dx + dz * dz);
  return { x: startX + Math.cos(snapped) * dist, z: startZ + Math.sin(snapped) * dist };
}

function getNodeTangent(roadData, currentSegment, node, towardPoint, invert) {
  const connected = roadData.segments.filter(
    (s) =>
      s.id !== currentSegment.id &&
      (s.startNodeId === node.id || s.endNodeId === node.id)
  );
  if (connected.length === 0) {
    const dir = new THREE.Vector3(towardPoint.x - node.x, 0, towardPoint.z - node.z);
    if (dir.lengthSq() === 0) return new THREE.Vector3(1, 0, 0);
    return invert ? dir.normalize().negate() : dir.normalize();
  }
  let avg = new THREE.Vector3();
  for (const seg of connected) {
    const otherId = seg.startNodeId === node.id ? seg.endNodeId : seg.startNodeId;
    const other = roadData.nodes.find((n) => n.id === otherId);
    if (other) avg.add(new THREE.Vector3(other.x - node.x, 0, other.z - node.z));
  }
  if (avg.lengthSq() === 0) {
    const dir = new THREE.Vector3(towardPoint.x - node.x, 0, towardPoint.z - node.z);
    return invert ? dir.normalize().negate() : dir.normalize();
  }
  return invert ? avg.normalize().negate() : avg.normalize();
}

// Minimum radius of curvature enforced on all curved road segments.
// Prevents the road from folding over itself or creating sharp kinks.
const MIN_CURVE_RADIUS = 4.0;

// Compute the minimum local radius of curvature along a sampled curve by
// measuring the turning angle between consecutive tangent segments.
function computeMinRadius(curve, segs) {
  const pts = curve.getSpacedPoints(segs);
  let minRadius = Infinity;
  for (let i = 1; i < pts.length - 1; i++) {
    const v1 = pts[i].clone().sub(pts[i - 1]);
    const v2 = pts[i + 1].clone().sub(pts[i]);
    const crossLen = new THREE.Vector3().crossVectors(v1, v2).length();
    if (crossLen < 1e-8) continue;
    const dot = THREE.MathUtils.clamp(v1.dot(v2) / (v1.length() * v2.length()), -1, 1);
    const angle = Math.acos(dot);
    if (angle < 1e-6) continue;
    const radius = Math.min(v1.length(), v2.length()) / (2 * Math.sin(angle / 2));
    if (radius < minRadius) minRadius = radius;
  }
  return minRadius;
}

export function buildSegmentCurve(segment, roadData) {
  const startNode = roadData.nodes.find((n) => n.id === segment.startNodeId);
  const endNode = roadData.nodes.find((n) => n.id === segment.endNodeId);
  if (!startNode || !endNode) return null;
  const start = new THREE.Vector3(startNode.x, 0, startNode.z);
  const end = new THREE.Vector3(endNode.x, 0, endNode.z);
  if (!segment.curved) return new THREE.LineCurve3(start, end);

  const dist = Math.max(0.1, start.distanceTo(end));
  const startTan = getNodeTangent(roadData, segment, startNode, end, false);
  const endTan = getNodeTangent(roadData, segment, endNode, start, true);

  // Clamp handle magnitude to at most 1/3 of chord distance — prevents the
  // Bezier from looping or folding over itself.
  const startHandleLen = Math.min(dist * 0.35, dist / 3);
  const endHandleLen = Math.min(dist * 0.35, dist / 3);

  let cp1 = start.clone().add(startTan.clone().multiplyScalar(startHandleLen));
  let cp2 = end.clone().add(endTan.clone().multiplyScalar(endHandleLen));
  let curve = new THREE.CubicBezierCurve3(start, cp1, cp2, end);

  // Iteratively reduce handle magnitudes until the minimum radius constraint
  // is satisfied or we exhaust the iteration budget.
  let scale = 1.0;
  for (let iter = 0; iter < 8; iter++) {
    const minR = computeMinRadius(curve, 24);
    if (minR >= MIN_CURVE_RADIUS) break;
    scale *= 0.75;
    cp1 = start.clone().add(startTan.clone().multiplyScalar(startHandleLen * scale));
    cp2 = end.clone().add(endTan.clone().multiplyScalar(endHandleLen * scale));
    curve = new THREE.CubicBezierCurve3(start, cp1, cp2, end);
  }

  return curve;
}

// ---- Mesh generation ----

// Sample a curve into evenly-spaced points with a stable orientation frame
// computed via Parallel Transport. This prevents the normal vector from
// twisting or flipping along the curve, keeping the road ribbon perfectly
// uniform even through S-curves and tight turns.
//
// Frame at each sample:
//   forward = unit tangent along curve direction
//   up      = world up (0,1,0), kept perpendicular to forward
//   normal  = cross(up, forward) — points to the LEFT of travel direction
//
// The normal is propagated from the initial frame using Rodrigues rotation,
// rotating the previous normal by the same angle/axis that rotates the
// previous tangent into the current tangent.
function sampleCurve(curve, segs) {
  const points = curve.getSpacedPoints(segs);
  const tangents = [];
  const normals = [];

  // Step 1: compute all forward (tangent) vectors, flattened to XZ plane
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const tan = curve.getTangentAt(t).clone();
    tan.y = 0;
    if (tan.lengthSq() < 1e-8) tan.set(1, 0, 0);
    tangents.push(tan.normalize());
  }

  // Step 2: initialize the first frame
  const worldUp = new THREE.Vector3(0, 1, 0);
  let prevForward = tangents[0].clone();
  let prevNormal = new THREE.Vector3().crossVectors(worldUp, prevForward);
  if (prevNormal.lengthSq() < 1e-8) prevNormal.set(0, 0, 1);
  prevNormal.normalize();

  // Step 3: parallel-transport the normal along the curve
  for (let i = 0; i <= segs; i++) {
    const forward = tangents[i];

    if (i > 0) {
      // Compute the rotation that maps prevForward → forward
      const axis = new THREE.Vector3().crossVectors(prevForward, forward);
      const axisLen = axis.length();

      if (axisLen > 1e-8) {
        axis.divideScalar(axisLen);
        const cosA = THREE.MathUtils.clamp(prevForward.dot(forward), -1, 1);
        const angle = Math.acos(cosA);

        // Rodrigues' rotation formula: rotate prevNormal around axis by angle
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dot = prevNormal.dot(axis);
        const rotated = prevNormal.clone()
          .multiplyScalar(cos)
          .add(axis.clone().multiplyScalar(dot * (1 - cos)))
          .add(new THREE.Vector3().crossVectors(axis, prevNormal).multiplyScalar(sin));

        // Re-orthogonalize against the current forward to guarantee exactness
        const proj = rotated.clone().sub(forward.clone().multiplyScalar(rotated.dot(forward)));
        if (proj.lengthSq() >= 1e-8) {
          prevNormal = proj.normalize();
        }
      }
    }

    normals.push(prevNormal.clone());
    prevForward = forward.clone();
  }

  return { points, normals, tangents };
}

// Build a flat ribbon mesh with UV coordinates mapped along the curve length.
// UVs: u = 0 (left edge) / 1 (right edge), v = cumulative distance along curve.
function buildRibbon(points, normals, leftOff, rightOff, y, color, roughness) {
  const positions = [];
  const uvs = [];
  const indices = [];
  let cumDist = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) cumDist += points[i].distanceTo(points[i - 1]);
    const left = points[i].clone().add(normals[i].clone().multiplyScalar(leftOff));
    const right = points[i].clone().sub(normals[i].clone().multiplyScalar(rightOff));
    positions.push(left.x, y, left.z, right.x, y, right.z);
    uvs.push(0, cumDist, 1, cumDist);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// Build a flat, perpendicular end-cap quad at the start (t=0) or end (t=1)
// of the road. The cap is a rectangle spanning the full road width, oriented
// perpendicular to the tangent direction at the endpoint. This lets dead-end
// roads and segment boundaries snap cleanly to adjacent straight roads
// without bulging or misaligned rounded geometry.
function buildEndCap(center, normal, tangent, halfW, y, color, roughness) {
  const depth = 0.04; // minimal extrusion along tangent to avoid z-fighting
  const outer = center.clone().add(tangent.clone().multiplyScalar(depth));
  const leftInner = center.clone().add(normal.clone().multiplyScalar(halfW));
  const rightInner = center.clone().sub(normal.clone().multiplyScalar(halfW));
  const leftOuter = outer.clone().add(normal.clone().multiplyScalar(halfW));
  const rightOuter = outer.clone().sub(normal.clone().multiplyScalar(halfW));

  const positions = [
    leftInner.x, y, leftInner.z,
    rightInner.x, y, rightInner.z,
    leftOuter.x, y, leftOuter.z,
    rightOuter.x, y, rightOuter.z,
  ];
  const uvs = [0, 0, 1, 0, 0, depth, 1, depth];
  const indices = [0, 1, 2, 1, 3, 2];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// Build a 3D ramp ribbon that follows per-point Y (for interchange ramps
// that rise from ground level to the bridge deck).
function buildRampMesh(points, normals, halfW, color) {
  const positions = [];
  const indices = [];
  for (let i = 0; i < points.length; i++) {
    const left = points[i].clone().add(normals[i].clone().multiplyScalar(halfW));
    const right = points[i].clone().sub(normals[i].clone().multiplyScalar(halfW));
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function computeNormals(points) {
  const normals = [];
  for (let i = 0; i < points.length; i++) {
    let tan;
    if (i === 0) tan = points[1].clone().sub(points[0]);
    else if (i === points.length - 1) tan = points[i].clone().sub(points[i - 1]);
    else tan = points[i + 1].clone().sub(points[i - 1]);
    tan.y = 0;
    tan.normalize();
    normals.push(new THREE.Vector3(-tan.z, 0, tan.x));
  }
  return normals;
}

function buildDashedRibbon(points, normals, y, color, width, dashLen, gapLen, offset) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide });
  const hw = width / 2;
  const cumDist = [0];
  for (let i = 1; i < points.length; i++) {
    cumDist[i] = cumDist[i - 1] + points[i].distanceTo(points[i - 1]);
  }
  const totalLen = cumDist[cumDist.length - 1];
  if (totalLen < 0.1) return group;
  const step = dashLen + gapLen;
  const numDashes = Math.floor(totalLen / step);
  for (let d = 0; d < numDashes; d++) {
    const dashStart = d * step;
    const dashEnd = Math.min(dashStart + dashLen, totalLen);
    const dPts = [];
    const dNrm = [];
    for (let i = 0; i < points.length; i++) {
      if (cumDist[i] >= dashStart - 0.01 && cumDist[i] <= dashEnd + 0.01) {
        dPts.push(points[i]);
        dNrm.push(normals[i]);
      }
    }
    if (dPts.length < 2) continue;
    const positions = [];
    const indices = [];
    for (let i = 0; i < dPts.length; i++) {
      const p = dPts[i].clone().add(dNrm[i].clone().multiplyScalar(offset));
      const n = dNrm[i].clone().multiplyScalar(hw);
      positions.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
    }
    for (let i = 0; i < dPts.length - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, mat));
  }
  return group;
}

function buildSolidRibbon(points, normals, y, color, width, offset) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide });
  const hw = width / 2;
  const positions = [];
  const indices = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i].clone().add(normals[i].clone().multiplyScalar(offset));
    const n = normals[i].clone().multiplyScalar(hw);
    positions.push(p.x + n.x, y, p.z + n.z, p.x - n.x, y, p.z - n.z);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  group.add(new THREE.Mesh(geo, mat));
  return group;
}

function buildGuardrails(group, points, normals, offset) {
  const railMat = new THREE.MeshStandardMaterial({ color: 0x999ea1, roughness: 0.5, metalness: 0.4 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
  for (let i = 0; i < points.length; i += 3) {
    for (const side of [1, -1]) {
      const pos = points[i].clone().add(normals[i].clone().multiplyScalar(offset * side));
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), postMat);
      post.position.set(pos.x, 0.3, pos.z);
      post.castShadow = true;
      group.add(post);
      if (i + 3 < points.length) {
        const ni = Math.min(i + 3, points.length - 1);
        const nextPos = points[ni].clone().add(normals[ni].clone().multiplyScalar(offset * side));
        const railLen = Math.max(0.1, pos.distanceTo(nextPos));
        const mid = pos.clone().lerp(nextPos, 0.5);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, railLen), railMat);
        rail.position.set(mid.x, 0.5, mid.z);
        const dir = nextPos.clone().sub(pos).normalize();
        rail.rotation.y = Math.atan2(dir.x, dir.z);
        rail.castShadow = true;
        group.add(rail);
      }
    }
  }
}

function buildRoadSegmentMesh(curve, roadType) {
  const group = new THREE.Group();
  const length = curve.getLength();
  if (length < 0.1) return group;
  const segs = Math.max(8, Math.floor(length / 0.25));
  const { points, normals, tangents } = sampleCurve(curve, segs);

  const halfW = roadType.width / 2;
  const y = 0.06;

  // Surface with UV coordinates aligned along curve length
  group.add(buildRibbon(points, normals, halfW, halfW, y, roadType.surfaceColor, 0.92));

  // Rounded end caps for smooth connections to adjacent segments
  group.add(buildEndCap(points[0], normals[0], tangents[0].clone().negate(), halfW, y, roadType.surfaceColor, 0.92));
  group.add(buildEndCap(points[points.length - 1], normals[normals.length - 1], tangents[tangents.length - 1], halfW, y, roadType.surfaceColor, 0.92));

  // Center dashed line (white)
  if (roadType.centerLineDashed) {
    group.add(buildDashedRibbon(points, normals, y + 0.01, roadType.centerLineColor, 0.18, 0.6, 0.4, 0));
  }

  // Edge lines
  if (roadType.hasEdgeLines) {
    const eo = halfW - 0.15;
    group.add(buildSolidRibbon(points, normals, y + 0.01, roadType.edgeLineColor, 0.12, eo));
    group.add(buildSolidRibbon(points, normals, y + 0.01, roadType.edgeLineColor, 0.12, -eo));
  }

  // Highway: parallel dashed lane lines + edge guardrails
  if (roadType.hasLaneLines) {
    for (const off of roadType.laneOffsets) {
      group.add(buildDashedRibbon(points, normals, y + 0.01, roadType.laneLineColor, 0.14, 0.5, 0.35, off));
    }
  }
  if (roadType.hasEdgeGuardrails) {
    buildGuardrails(group, points, normals, halfW + 0.1);
  }

  // Dirt road: tire tracks
  if (roadType.id === "dirt") {
    for (const off of [0.6, -0.6]) {
      group.add(buildSolidRibbon(points, normals, y + 0.005, 0xa89070, 0.35, off));
    }
  }

  return group;
}

// ---- Intersection detection ----
function lineSegIntersect2D(p1, p2, p3, p4) {
  const x1 = p1.x, z1 = p1.z, x2 = p2.x, z2 = p2.z;
  const x3 = p3.x, z3 = p3.z, x4 = p4.x, z4 = p4.z;
  const denom = (x1 - x2) * (z3 - z4) - (z1 - z2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((x1 - x3) * (z3 - z4) - (z1 - z3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (z1 - z3) - (z1 - z2) * (x1 - x3)) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), z: z1 + t * (z2 - z1) };
  }
  return null;
}

export function detectIntersections(roadData) {
  const intersections = [];
  const tol = 1.5;

  for (let i = 0; i < roadData.segments.length; i++) {
    const c1 = buildSegmentCurve(roadData.segments[i], roadData);
    if (!c1) continue;
    const pts1 = c1.getPoints(25);
    for (let j = i + 1; j < roadData.segments.length; j++) {
      const segI = roadData.segments[i];
      const segJ = roadData.segments[j];
      // Skip pairs that share a node — they meet at a node, not a crossing.
      // T-junctions at shared nodes are handled separately below.
      if (
        segI.startNodeId === segJ.startNodeId ||
        segI.startNodeId === segJ.endNodeId ||
        segI.endNodeId === segJ.startNodeId ||
        segI.endNodeId === segJ.endNodeId
      ) {
        continue;
      }
      const c2 = buildSegmentCurve(segJ, roadData);
      if (!c2) continue;
      const pts2 = c2.getPoints(25);
      for (let a = 0; a < pts1.length - 1; a++) {
        for (let b = 0; b < pts2.length - 1; b++) {
          const ip = lineSegIntersect2D(pts1[a], pts1[a + 1], pts2[b], pts2[b + 1]);
          if (ip) {
            const existing = intersections.find(
              (ix) => Math.abs(ix.x - ip.x) < tol && Math.abs(ix.z - ip.z) < tol
            );
            const ids = [roadData.segments[i].id, roadData.segments[j].id];
            if (existing) {
              ids.forEach((id) => {
                if (!existing.segmentIds.includes(id)) existing.segmentIds.push(id);
              });
            } else {
              intersections.push({ x: ip.x, z: ip.z, segmentIds: [...ids] });
            }
          }
        }
      }
    }
  }

  // Helper: heading (radians) of a segment at a given node.
  // Heading points AWAY from the node along the segment.
  function getSegmentHeadingAtNode(seg, node) {
    const otherId = seg.startNodeId === node.id ? seg.endNodeId : seg.startNodeId;
    const other = roadData.nodes.find((n) => n.id === otherId);
    if (!other) return null;
    return Math.atan2(other.z - node.z, other.x - node.x);
  }

  // Two headings are "collinear" if they point in the same or opposite direction
  // (i.e. the roads are a straight continuation of each other).
  function areHeadingsCollinear(h1, h2) {
    let diff = Math.abs(h1 - h2) % Math.PI;
    return diff < 0.25 || diff > Math.PI - 0.25;
  }

  // T-junctions: nodes with 3+ connected segments — but only if the connected
  // segments actually change direction. If all segments are collinear (a road
  // being extended in a straight line), this is NOT an intersection.
  for (const node of roadData.nodes) {
    const connected = roadData.segments.filter(
      (s) => s.startNodeId === node.id || s.endNodeId === node.id
    );
    if (connected.length < 3) continue;

    const headings = connected
      .map((s) => getSegmentHeadingAtNode(s, node))
      .filter((h) => h !== null);
    if (headings.length < 3) continue;

    // Count distinct heading groups. Merge collinear headings together.
    const groups = [];
    for (const h of headings) {
      const existingGroup = groups.find((g) => areHeadingsCollinear(g, h));
      if (existingGroup) {
        // keep the group, but don't add a new one
      } else {
        groups.push(h);
      }
    }
    // If all headings collapse into a single group, the road is just continuing
    // straight — not an intersection.
    if (groups.length < 2) continue;

    if (!intersections.find((ix) => Math.abs(ix.x - node.x) < tol && Math.abs(ix.z - node.z) < tol)) {
      intersections.push({ x: node.x, z: node.z, segmentIds: connected.map((s) => s.id) });
    }
  }

  return intersections;
}

function buildTrafficLight(x, z, roadAngle) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = -roadAngle;

  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.3 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8), darkMat);
  pole.position.set(0, 1.6, 0);
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), darkMat);
  arm.position.set(0, 3.1, 0.5);
  group.add(arm);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.14), darkMat);
  housing.position.set(0, 2.8, 1.0);
  group.add(housing);

  const lightColors = [0xff0000, 0xffaa00, 0x00ff00];
  const lightY = [2.95, 2.8, 2.65];
  for (let i = 0; i < 3; i++) {
    const light = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 12),
      new THREE.MeshStandardMaterial({
        color: lightColors[i],
        emissive: lightColors[i],
        emissiveIntensity: 0.7,
      })
    );
    light.position.set(0, lightY[i], 1.08);
    light.rotation.x = -Math.PI / 2;
    group.add(light);
  }

  return group;
}

function buildIntersectionMesh(intersection, roadData) {
  const group = new THREE.Group();
  let maxW = 4;
  const approachDirs = [];

  for (const sid of intersection.segmentIds) {
    const seg = roadData.segments.find((s) => s.id === sid);
    if (!seg) continue;
    const rt = ROAD_TYPES[seg.roadType];
    if (!rt) continue;
    if (rt.width > maxW) maxW = rt.width;

    const startNode = roadData.nodes.find((n) => n.id === seg.startNodeId);
    const endNode = roadData.nodes.find((n) => n.id === seg.endNodeId);
    if (!startNode || !endNode) continue;

    const distToStart = (startNode.x - intersection.x) ** 2 + (startNode.z - intersection.z) ** 2;
    const distToEnd = (endNode.x - intersection.x) ** 2 + (endNode.z - intersection.z) ** 2;
    const farNode = distToStart > distToEnd ? startNode : endNode;
    const angle = Math.atan2(farNode.z - intersection.z, farNode.x - intersection.x);

    approachDirs.push({ angle, width: rt.width });
  }

  const radius = maxW * 0.65;

  // Circular asphalt surface
  const surfaceGeo = new THREE.CircleGeometry(radius, 32);
  const surfaceMat = new THREE.MeshStandardMaterial({ color: 0x4a4d51, roughness: 0.92, side: THREE.DoubleSide });
  const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(intersection.x, 0.07, intersection.z);
  surface.receiveShadow = true;
  group.add(surface);

  // Deduplicate approach directions (both directions of each segment)
  const allDirs = [];
  for (const { angle, width } of approachDirs) {
    allDirs.push({ angle, width });
    allDirs.push({ angle: angle + Math.PI, width });
  }
  const uniqueDirs = [];
  for (const dir of allDirs) {
    const isDup = uniqueDirs.some((d) => {
      let diff = Math.abs(((d.angle - dir.angle + Math.PI) % (2 * Math.PI)) - Math.PI);
      return diff < 0.35;
    });
    if (!isDup) uniqueDirs.push(dir);
  }

  // Stop lines + traffic lights for each approach
  for (const { angle, width } of uniqueDirs) {
    const stopDist = radius * 0.82;
    const stopX = intersection.x + Math.cos(angle) * stopDist;
    const stopZ = intersection.z + Math.sin(angle) * stopDist;
    const stopLine = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.85, 0.03, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
    );
    stopLine.position.set(stopX, 0.09, stopZ);
    stopLine.rotation.y = Math.PI / 2 - angle;
    group.add(stopLine);

    // Traffic light on right side of approaching traffic
    const perpX = -Math.sin(angle);
    const perpZ = Math.cos(angle);
    const lightDist = radius + 0.4;
    const lightX = intersection.x + Math.cos(angle) * lightDist + perpX * (width * 0.55);
    const lightZ = intersection.z + Math.sin(angle) * lightDist + perpZ * (width * 0.55);
    group.add(buildTrafficLight(lightX, lightZ, angle));
  }

  return group;
}

// ---- Interchange (highway × surface road) ----

// Global vertical datum: the upper deck sits exactly this many units above
// terrain (Z=0). All elevated geometry derives its Y from this constant.
const INTERCHANGE_DECK_CLEARANCE = 6.0;

// Bridge deck structural depth (thickness of the extruded deck ribbon).
const INTERCHANGE_DECK_DEPTH = 0.5;

// Maximum allowed vertical grade for ramps (rise / run). 6% = 0.06.
const MAX_RAMP_GRADE = 0.06;

// Interval (in world units along the spline arc length) between support piers.
const PIER_INTERVAL = 25.0;

// Clearance zone around the surface-road underpass where piers are suppressed
// to avoid clipping through ground-level traffic.
const PIER_CLEAR_ZONE = 0; // computed dynamically from surface road width

function getApproachAngle(seg, intersection, roadData) {
  const startNode = roadData.nodes.find((n) => n.id === seg.startNodeId);
  const endNode = roadData.nodes.find((n) => n.id === seg.endNodeId);
  if (!startNode || !endNode) return 0;
  const distToStart = (startNode.x - intersection.x) ** 2 + (startNode.z - intersection.z) ** 2;
  const distToEnd = (endNode.x - intersection.x) ** 2 + (endNode.z - intersection.z) ** 2;
  const farNode = distToStart > distToEnd ? startNode : endNode;
  return Math.atan2(farNode.z - intersection.z, farNode.x - intersection.x);
}

// Linear ease-in / ease-out: 0 at t=0, 1 at t=1, with smoothstart-smoothstop
// interpolation. Used for ramp vertical profiles so the slope is zero at both
// merge points (no jarring step where the ramp meets the deck or ground).
function easeInOut(t) {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Compute the minimum horizontal run required to climb from groundY to deckY
// without exceeding the maximum grade constraint.
function minRampRun(rise) {
  return Math.abs(rise) / MAX_RAMP_GRADE;
}

// Build an extruded 3D ribbon with thickness — a top surface and a bottom
// surface connected by side walls. Used for the bridge deck so it has real
// structural depth rather than being a flat plane.
function buildExtrudedRibbon(points, normals, halfW, topY, depth, color, roughness) {
  const group = new THREE.Group();
  const bottomY = topY - depth;
  const positions = [];
  const uvs = [];
  const indices = [];

  let cumDist = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) cumDist += points[i].distanceTo(points[i - 1]);
    const n = normals[i];
    const cx = points[i].x, cz = points[i].z;
    // Top-left, top-right, bottom-left, bottom-right
    positions.push(
      cx + n.x * halfW, topY,    cz + n.z * halfW,
      cx - n.x * halfW, topY,    cz - n.z * halfW,
      cx + n.x * halfW, bottomY, cz + n.z * halfW,
      cx - n.x * halfW, bottomY, cz - n.z * halfW,
    );
    uvs.push(0, cumDist, 1, cumDist, 0, cumDist, 1, cumDist);
  }

  const nPts = points.length;
  for (let i = 0; i < nPts - 1; i++) {
    const a = i * 4;
    // Top face
    indices.push(a, a + 1, a + 4, a + 1, a + 5, a + 4);
    // Bottom face (reversed winding)
    indices.push(a + 2, a + 6, a + 3, a + 3, a + 6, a + 7);
    // Left wall
    indices.push(a, a + 4, a + 2, a + 2, a + 4, a + 6);
    // Right wall
    indices.push(a + 1, a + 3, a + 5, a + 3, a + 7, a + 5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

// Sample a straight line in the highway direction and return points, normals,
// and tangents suitable for the extruded ribbon builder.
function sampleStraightPath(originX, originZ, angle, length, y) {
  const segs = Math.max(2, Math.floor(length / 1.0));
  const points = [];
  const tangents = [];
  const normals = [];
  const tan = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  const nor = new THREE.Vector3(-tan.z, 0, tan.x);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    points.push(new THREE.Vector3(originX + tan.x * length * t, y, originZ + tan.z * length * t));
    tangents.push(tan.clone());
    normals.push(nor.clone());
  }
  return { points, normals, tangents };
}

// Build a smooth ramp from a ground-level start to the elevated deck.
// The horizontal path uses a cubic Bezier whose control points are set so the
// start tangent aligns with the surface-road approach direction and the end
// tangent aligns with the highway direction — guaranteeing tangent-matched
// merges at both endpoints. The vertical profile uses ease-in/ease-out and is
// stretched to satisfy the max-grade constraint.
function buildRamp(startGround, endDeck, startTangent, endTangent, rampHalfW, color) {
  const dx = endDeck.x - startGround.x;
  const dz = endDeck.z - startGround.z;
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);
  const rise = endDeck.y - startGround.y;
  if (horizontalDist < 0.5) return null;

  // Ensure the ramp is long enough to satisfy the grade constraint.
  // If the natural horizontal distance is too short, extend the start point
  // backward along the approach tangent.
  const requiredRun = minRampRun(rise);
  let actualStart = startGround.clone();
  let actualHorizDist = horizontalDist;
  if (horizontalDist < requiredRun) {
    const extension = requiredRun - horizontalDist;
    actualStart = startGround.clone().sub(startTangent.clone().multiplyScalar(extension));
    actualHorizDist = requiredRun;
  }

  // Control points for a cubic Bezier in the XZ plane.
  // Handle length = 1/3 of the horizontal distance, aligned with the
  // respective approach/exit tangents for C1 continuity at merge points.
  const handleLen = actualHorizDist / 3;
  const cp1 = actualStart.clone().add(startTangent.clone().multiplyScalar(handleLen));
  const cp2 = endDeck.clone().sub(endTangent.clone().multiplyScalar(handleLen));

  const rSegs = Math.max(12, Math.floor(actualHorizDist / 0.5));
  const pts = [];
  const normals = [];
  const tangents = [];

  for (let i = 0; i <= rSegs; i++) {
    const t = i / rSegs;
    // Cubic Bezier interpolation in XZ
    const u = 1 - t;
    const x = u * u * u * actualStart.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * endDeck.x;
    const z = u * u * u * actualStart.z + 3 * u * u * t * cp1.z + 3 * u * t * t * cp2.z + t * t * t * endDeck.z;

    // Vertical profile: ease-in/ease-out from ground to deck height.
    const y = startGround.y + rise * easeInOut(t);

    pts.push(new THREE.Vector3(x, y, z));

    // Tangent via Bezier derivative
    const tx = 3 * u * u * (cp1.x - actualStart.x) + 6 * u * t * (cp2.x - cp1.x) + 3 * t * t * (endDeck.x - cp2.x);
    const tz = 3 * u * u * (cp1.z - actualStart.z) + 6 * u * t * (cp2.z - cp1.z) + 3 * t * t * (endDeck.z - cp2.z);
    const tan = new THREE.Vector3(tx, 0, tz);
    if (tan.lengthSq() < 1e-8) tan.set(1, 0, 0);
    tan.normalize();
    tangents.push(tan);
    normals.push(new THREE.Vector3(-tan.z, 0, tan.x));
  }

  // Build a thin ramp ribbon that follows the 3D points (with per-point Y)
  const positions = [];
  const uvs = [];
  const indices = [];
  let cumDist = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) cumDist += pts[i].distanceTo(pts[i - 1]);
    const left = pts[i].clone().add(normals[i].clone().multiplyScalar(rampHalfW));
    const right = pts[i].clone().sub(normals[i].clone().multiplyScalar(rampHalfW));
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, cumDist, 1, cumDist);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  return { group, points: pts, normals, tangents };
}

// Deploy support piers along an elevated spline path at fixed intervals.
// Piers within the clear-zone of the surface-road underpass are skipped to
// prevent clipping through ground-level traffic.
function buildPiers(deckPoints, deckY, intersection, surfaceAngle, surfaceWidth) {
  const group = new THREE.Group();
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.85 });
  const pierRadius = 0.35;

  // Cumulative arc length along the deck spline
  const cumLen = [0];
  for (let i = 1; i < deckPoints.length; i++) {
    cumLen[i] = cumLen[i - 1] + deckPoints[i].distanceTo(deckPoints[i - 1]);
  }
  const totalLen = cumLen[cumLen.length - 1];

  // Clear zone: a rectangle centered on the intersection, aligned with the
  // surface road, extending by the surface road half-width + margin.
  const clearHalfLen = surfaceWidth * 0.7 + 2;
  const cosS = Math.cos(surfaceAngle);
  const sinS = Math.sin(surfaceAngle);

  function isInClearZone(x, z) {
    const dx = x - intersection.x;
    const dz = z - intersection.z;
    // Project onto surface-road-aligned axes
    const along = dx * cosS + dz * sinS;
    const perp = -dx * sinS + dz * cosS;
    return Math.abs(along) < clearHalfLen && Math.abs(perp) < clearHalfLen;
  }

  // Place piers every PIER_INTERVAL, starting from the first interval boundary
  for (let d = PIER_INTERVAL; d < totalLen - PIER_INTERVAL * 0.3; d += PIER_INTERVAL) {
    // Find the point on the deck at arc length d
    let idx = 0;
    while (idx < cumLen.length - 1 && cumLen[idx + 1] < d) idx++;
    const segT = (d - cumLen[idx]) / Math.max(1e-6, cumLen[idx + 1] - cumLen[idx]);
    const p = deckPoints[idx].clone().lerp(deckPoints[idx + 1], segT);

    if (isInClearZone(p.x, p.z)) continue;

    const pierHeight = Math.max(0.1, p.y);
    const pier = new THREE.Mesh(
      new THREE.CylinderGeometry(pierRadius, pierRadius * 1.1, pierHeight, 10),
      pierMat
    );
    pier.position.set(p.x, pierHeight / 2, p.z);
    pier.castShadow = true;
    group.add(pier);

    // Pier cap (square footing on top)
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(pierRadius * 2.2, 0.2, pierRadius * 2.2),
      pierMat
    );
    cap.position.set(p.x, pierHeight - 0.1, p.z);
    cap.castShadow = true;
    group.add(cap);
  }

  return group;
}

function buildInterchangeMesh(intersection, roadData) {
  const group = new THREE.Group();

  // Identify the highway segment and the surface-road segment
  let hwSeg = null, surfaceSeg = null;
  for (const sid of intersection.segmentIds) {
    const seg = roadData.segments.find((s) => s.id === sid);
    if (!seg) continue;
    if (seg.roadType === "highway") hwSeg = seg;
    else surfaceSeg = seg;
  }
  // Fallback to regular intersection if not a highway × surface-road crossing
  if (!hwSeg || !surfaceSeg) return buildIntersectionMesh(intersection, roadData);

  const hwAngle = getApproachAngle(hwSeg, intersection, roadData);
  const surfaceAngle = getApproachAngle(surfaceSeg, intersection, roadData);
  const hwType = ROAD_TYPES.highway;
  const hwWidth = hwType.width;
  const surfaceWidth = (ROAD_TYPES[surfaceSeg.roadType] || { width: 5 }).width;

  // Vertical datum: deck top surface at INTERCHANGE_DECK_CLEARANCE
  const deckTopY = INTERCHANGE_DECK_CLEARANCE;
  const deckBottomY = deckTopY - INTERCHANGE_DECK_DEPTH;
  const deckCenterY = (deckTopY + deckBottomY) / 2;

  // Bridge deck length: spans far enough to clear the surface road + ramps
  const bridgeLen = Math.max(hwWidth * 4, surfaceWidth * 4, 40);

  const cosH = Math.cos(hwAngle);
  const sinH = Math.sin(hwAngle);

  // --- Procedural bridge deck: extruded 3D ribbon following the highway
  //     profile, inheriting the highway's width and lane data. ---
  const deckPath = sampleStraightPath(
    intersection.x - cosH * bridgeLen / 2,
    intersection.z - sinH * bridgeLen / 2,
    hwAngle,
    bridgeLen,
    deckCenterY
  );
  group.add(buildExtrudedRibbon(
    deckPath.points, deckPath.normals,
    hwWidth / 2, deckTopY, INTERCHANGE_DECK_DEPTH,
    hwType.surfaceColor, 0.92
  ));

  // Lane markings on the deck surface (inherited from highway archetype)
  if (hwType.centerLineDashed) {
    group.add(buildDashedRibbon(deckPath.points, deckPath.normals, deckTopY + 0.01, hwType.centerLineColor, 0.18, 0.6, 0.4, 0));
  }
  if (hwType.hasEdgeLines) {
    const eo = hwWidth / 2 - 0.15;
    group.add(buildSolidRibbon(deckPath.points, deckPath.normals, deckTopY + 0.01, hwType.edgeLineColor, 0.12, eo));
    group.add(buildSolidRibbon(deckPath.points, deckPath.normals, deckTopY + 0.01, hwType.edgeLineColor, 0.12, -eo));
  }
  if (hwType.hasLaneLines) {
    for (const off of hwType.laneOffsets) {
      group.add(buildDashedRibbon(deckPath.points, deckPath.normals, deckTopY + 0.01, hwType.laneLineColor, 0.14, 0.5, 0.35, off));
    }
  }

  // Concrete barrier parapets along the deck edges (replacing guardrails)
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0x999ea1, roughness: 0.5, metalness: 0.3 });
  for (const side of [1, -1]) {
    const barrier = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.9, bridgeLen),
      barrierMat
    );
    const bx = -sinH * (hwWidth / 2 - 0.15) * side;
    const bz = cosH * (hwWidth / 2 - 0.15) * side;
    barrier.position.set(intersection.x + bx, deckTopY + 0.45, intersection.z + bz);
    barrier.rotation.y = -hwAngle;
    barrier.castShadow = true;
    group.add(barrier);
  }

  // --- Procedural substructure: auto-deploy support piers along the deck ---
  group.add(buildPiers(deckPath.points, deckCenterY, intersection, surfaceAngle, surfaceWidth));

  // --- Diamond ramps: 4 ramps connecting the surface road to the highway deck ---
  // Each ramp's start tangent matches the surface-road approach direction and
  // end tangent matches the highway direction — C1-continuous merges with
  // Z-snapping to the deck elevation.
  const rampHalfW = 1.8;
  const rampColor = hwType.surfaceColor;
  const surfaceHalfW = surfaceWidth / 2;
  const deckHalfLen = bridgeLen / 2;

  // Surface-road approach tangent (forward direction along surface road)
  const surfTan = new THREE.Vector3(Math.cos(surfaceAngle), 0, Math.sin(surfaceAngle));
  // Highway tangent (forward direction along highway)
  const hwTan = new THREE.Vector3(Math.cos(hwAngle), 0, Math.sin(hwAngle));

  for (const sSide of [1, -1]) {
    for (const hSide of [1, -1]) {
      // Ramp start: on the surface road, offset along surface angle and
      // perpendicular (to the side of the road)
      const startOffsetAlong = deckHalfLen * 0.45 * hSide;
      const startOffsetPerp = surfaceHalfW + 1.5;
      const sx = intersection.x + Math.cos(surfaceAngle) * startOffsetAlong + (-Math.sin(surfaceAngle)) * startOffsetPerp * sSide;
      const sz = intersection.z + Math.sin(surfaceAngle) * startOffsetAlong + Math.cos(surfaceAngle) * startOffsetPerp * sSide;

      // Ramp end: on the highway deck, offset along highway direction
      const endOffsetAlong = deckHalfLen * 0.5 * hSide * sSide;
      const endOffsetPerp = hwWidth / 2 - 0.3;
      const ex = intersection.x + cosH * endOffsetAlong + (-sinH) * endOffsetPerp * sSide;
      const ez = intersection.z + sinH * endOffsetAlong + cosH * endOffsetPerp * sSide;

      const startGround = new THREE.Vector3(sx, 0.1, sz);
      const endDeck = new THREE.Vector3(ex, deckTopY, ez);

      // Start tangent: pointing toward the intersection along the surface road
      const startTan = surfTan.clone().multiplyScalar(-hSide);
      // End tangent: pointing away from the intersection along the highway
      const endTan = hwTan.clone().multiplyScalar(hSide * sSide);

      const ramp = buildRamp(startGround, endDeck, startTan, endTan, rampHalfW, rampColor);
      if (ramp) group.add(ramp.group);
    }
  }

  // --- Underpass: widen surface road area beneath the bridge ---
  const underpassGeo = new THREE.PlaneGeometry(surfaceWidth + 1, bridgeLen * 0.85);
  const underpass = new THREE.Mesh(
    underpassGeo,
    new THREE.MeshStandardMaterial({ color: 0x4a4d51, roughness: 0.92, side: THREE.DoubleSide })
  );
  underpass.rotation.x = -Math.PI / 2;
  underpass.position.set(intersection.x, 0.07, intersection.z);
  underpass.rotation.z = -surfaceAngle;
  underpass.receiveShadow = true;
  group.add(underpass);

  return group;
}

// ---- Main mesh generation ----
export function generateRoadMeshes(roadData) {
  const group = new THREE.Group();
  for (const seg of roadData.segments) {
    const rt = ROAD_TYPES[seg.roadType];
    if (!rt) continue;
    const curve = buildSegmentCurve(seg, roadData);
    if (!curve) continue;
    group.add(buildRoadSegmentMesh(curve, rt));
  }
  const intersections = detectIntersections(roadData);
  for (const inter of intersections) {
    // Use an interchange when a highway crosses a surface road; otherwise a
    // regular traffic-light intersection.
    const segs = inter.segmentIds
      .map((sid) => roadData.segments.find((s) => s.id === sid))
      .filter(Boolean);
    const hasHighway = segs.some((s) => s.roadType === "highway");
    const hasSurface = segs.some((s) => s.roadType !== "highway");
    if (hasHighway && hasSurface) {
      group.add(buildInterchangeMesh(inter, roadData));
    } else {
      group.add(buildIntersectionMesh(inter, roadData));
    }
  }
  return group;
}

export function generateNodeMeshes(roadData, currentNodeIds = []) {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.4, 12, 12);
  for (const node of roadData.nodes) {
    const isActive = currentNodeIds.includes(node.id);
    const mat = new THREE.MeshStandardMaterial({
      color: isActive ? 0x00ffff : 0xffff00,
      emissive: isActive ? 0x004444 : 0x444400,
      emissiveIntensity: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(node.x, 0.5, node.z);
    mesh.castShadow = true;
    group.add(mesh);
  }
  return group;
}

// ---- Proximity check for building adjacency ----
function distToSeg2D(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((px - (x1 + t * dx)) ** 2 + (pz - (z1 + t * dz)) ** 2);
}

export function isNearRoad(roadData, worldX, worldZ, threshold = 5) {
  for (const seg of roadData.segments) {
    const curve = buildSegmentCurve(seg, roadData);
    if (!curve) continue;
    const pts = curve.getPoints(15);
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSeg2D(worldX, worldZ, pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z) < threshold) {
        return true;
      }
    }
  }
  return false;
}

export function findNearestSegment(roadData, x, z, threshold = 3) {
  let nearest = null;
  let minDist = threshold;
  for (const seg of roadData.segments) {
    const curve = buildSegmentCurve(seg, roadData);
    if (!curve) continue;
    const pts = curve.getPoints(20);
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distToSeg2D(x, z, pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z);
      if (d < minDist) {
        minDist = d;
        nearest = seg;
      }
    }
  }
  return nearest;
}

// Check if a building footprint (axis-aligned rectangle) overlaps any road segment.
// Uses Liang-Barsky line-rectangle clipping for accurate intersection detection.
function segIntersectsRect(x1, z1, x2, z2, minX, maxX, minZ, maxZ) {
  const dx = x2 - x1, dz = z2 - z1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dz, dz];
  const q = [x1 - minX, maxX - x1, z1 - minZ, maxZ - z1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function isBuildingOnRoad(roadData, centerX, centerZ, halfW, halfD) {
  const minX = centerX - halfW;
  const maxX = centerX + halfW;
  const minZ = centerZ - halfD;
  const maxZ = centerZ + halfD;
  for (const seg of roadData.segments) {
    const curve = buildSegmentCurve(seg, roadData);
    if (!curve) continue;
    const pts = curve.getPoints(20);
    for (let i = 0; i < pts.length - 1; i++) {
      if (segIntersectsRect(pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z, minX, maxX, minZ, maxZ)) {
        return true;
      }
    }
  }
  return false;
}
