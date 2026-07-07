import * as THREE from "three";
import { BUILDINGS, GRID_COLS, GRID_ROWS } from "@/lib/gameConfig";
import {
  addBox,
  addCylinder,
  addCornice,
  addPilasters,
  addSillCourses,
  addRailing,
  addTexturedWall,
  hexToRgb,
  shade,
  makeFacadeTexture,
} from "./builders/shared";
import {
  buildBrownstone,
  buildBrickBuilding,
  buildModernResidential,
  buildSimpleHouse,
} from "./builders/residential";

export const TILE_SIZE = 2;
export const GRID_OFFSET_X = -(GRID_COLS * TILE_SIZE) / 2;
export const GRID_OFFSET_Z = -(GRID_ROWS * TILE_SIZE) / 2;

export const BUILDING_HEIGHTS = {
  road: 0.08,
  road_twoway: 0.1,
  road_sidewalk: 0.06,
  road_highway: 0.12,
  res_shack: 3.0,
  res_cabin: 3.5,
  res_cottage: 6.0,
  res_tenement: 9.0,
  res_brownstone: 8.0,
  res_victorian: 8.5,
  res_townhouse: 8.0,
  res_walkup: 12.0,
  res_artdeco: 16.0,
  res_midcentury: 18.0,
  res_brutalist: 24.0,
  res_soviet: 22.0,
  res_garden: 14.0,
  res_modernist: 28.0,
  res_glass: 36.0,
  res_condo: 42.0,
  res_penthouse: 50.0,
  res_eco: 32.0,
  res_smart: 56.0,
  res_futuristic: 70.0,
  commercial_small: 7.0,
  commercial_large: 20.0,
  industrial_small: 9.0,
  industrial_large: 12.0,
  power_plant: 14.0,
  solar_farm: 0.8,
  police: 8.0,
  fire_station: 8.0,
  hospital: 12.0,
  school: 10.0,
  park: 1.5,
  stadium: 20.0,
};

// ---- Road meshes ----
function createRoadMesh(group, buildingId) {
  const ts = TILE_SIZE;
  const isTwoWay = buildingId === "road_twoway";
  const isSidewalk = buildingId === "road_sidewalk";
  const isHighway = buildingId === "road_highway";

  if (isSidewalk) {
    addBox(group, ts * 0.98, 0.08, ts * 0.98, 0, 0.04, 0, "#9a9a9a");
    addBox(group, ts * 0.7, 0.02, 0.06, 0, 0.09, 0, "#b0b0b0");
    addBox(group, 0.06, 0.02, ts * 0.7, 0, 0.09, 0, "#b0b0b0");
  } else if (isHighway) {
    addBox(group, ts * 0.98, 0.14, ts * 0.98, 0, 0.07, 0, "#1a1a1a");
    for (const off of [-ts * 0.22, 0, ts * 0.22]) {
      for (let z = -ts * 0.4; z < ts * 0.4; z += 0.25) {
        addBox(group, 0.06, 0.02, 0.12, 0, 0.15, z, "#ffffff");
      }
    }
    addBox(group, 0.08, 0.05, ts * 0.9, 0, 0.12, 0, "#f5d442");
    // Shoulders
    addBox(group, ts * 0.98, 0.02, 0.1, 0, 0.15, ts * 0.44, "#ffffff");
    addBox(group, ts * 0.98, 0.02, 0.1, 0, 0.15, -ts * 0.44, "#ffffff");
  } else if (isTwoWay) {
    addBox(group, ts * 0.98, 0.12, ts * 0.98, 0, 0.06, 0, "#2a2a2a");
    addBox(group, 0.04, 0.02, ts * 0.5, -0.08, 0.13, 0, "#f5d442");
    addBox(group, 0.04, 0.02, ts * 0.5, 0.08, 0.13, 0, "#f5d442");
    addBox(group, ts * 0.9, 0.02, 0.04, 0, 0.13, ts * 0.4, "#ffffff");
    addBox(group, ts * 0.9, 0.02, 0.04, 0, 0.13, -ts * 0.4, "#ffffff");
  } else {
    addBox(group, ts * 0.98, 0.1, ts * 0.98, 0, 0.05, 0, "#3a3a3a");
    for (let z = -ts * 0.35; z < ts * 0.35; z += 0.3) {
      addBox(group, 0.08, 0.02, 0.15, 0, 0.11, z, "#f5d442");
    }
    addBox(group, ts * 0.9, 0.02, 0.03, 0, 0.11, ts * 0.42, "#ffffff");
    addBox(group, ts * 0.9, 0.02, 0.03, 0, 0.11, -ts * 0.42, "#ffffff");
  }
  return group;
}

// ---- Special buildings ----
function createParkMesh(group, w, d) {
  addBox(group, w, 0.1, d, 0, 0.05, 0, "#3a7a3a");
  const positions = [[-w * 0.25, -d * 0.2], [w * 0.22, d * 0.18], [-w * 0.1, d * 0.25], [w * 0.15, -d * 0.15]];
  for (const [tx, tz] of positions) {
    addCylinder(group, 0.06, 0.08, 0.4, tx, 0.25, tz, "#5a3a1a", 6);
    addCylinder(group, 0, 0.3, 0.6, tx, 0.7, tz, "#2a6a2a", 7);
    addCylinder(group, 0, 0.2, 0.4, tx, 1.0, tz, "#3a7a3a", 7);
  }
  addBox(group, 0.25, 0.12, 0.08, 0, 0.11, 0, "#8a6a3a");
  // Path
  addBox(group, 0.3, 0.02, d * 0.8, 0, 0.06, 0, "#a0a0a0");
  return group;
}

function createSolarMesh(group, w, d, size) {
  addBox(group, w, 0.08, d, 0, 0.04, 0, "#2a2a2a");
  const cols = Math.floor(size[0] * 2);
  const rows = Math.floor(size[1] * 2);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const px = -w / 2 + (i + 0.5) * (w / cols);
      const pz = -d / 2 + (j + 0.5) * (d / rows);
      addBox(group, (w / cols) * 0.85, 0.04, (d / rows) * 0.85, px, 0.25, pz, "#1a3a5a",
        { metalness: 0.5, roughness: 0.2, emissive: "#0a1a2a", emissiveIntensity: 0.2 });
      // Support post
      addBox(group, 0.04, 0.25, 0.04, px, 0.12, pz, "#555555");
    }
  }
  return group;
}

function createStadiumMesh(group, w, d, h, cfg) {
  addBox(group, w, h, d, 0, h / 2, 0, cfg.color);
  addBox(group, w * 0.6, 0.15, d * 0.6, 0, h + 0.08, 0, "#2a5a2a");
  addBox(group, w * 0.5, 0.02, 0.03, 0, h + 0.16, 0, "#ffffff");
  addBox(group, 0.03, 0.02, d * 0.5, 0, h + 0.16, 0, "#ffffff");
  for (const [lx, lz] of [[w*0.4, d*0.4], [-w*0.4, d*0.4], [w*0.4, -d*0.4], [-w*0.4, -d*0.4]]) {
    addCylinder(group, 0.08, 0.1, h * 0.6, lx, h + h * 0.3, lz, "#888888", 6);
    addBox(group, 0.3, 0.15, 0.15, lx, h + h * 0.6, lz, "#ffffaa", { emissive: "#ffff00", emissiveIntensity: 0.4 });
  }
  return group;
}

// ---- Commercial ----
function buildCommercial(group, w, d, h, cfg, isLarge) {
  const base = cfg.color;
  const trim = "#222222";
  const win = "#2a3a4a";

  const groundH = Math.min(2.0, h * 0.25);
  // Glass ground floor
  addBox(group, w, groundH, d, 0, groundH / 2, 0, shade(hexToRgb(base), -10));
  const gh = groundH * 0.75;
  addBox(group, w * 0.96, gh, 0.05, 0, groundH * 0.45, d / 2 + 0.01, "#1a2a3a",
    { metalness: 0.3, roughness: 0.2, emissive: "#0a1a2a", emissiveIntensity: 0.15 });
  addBox(group, 0.05, gh, d * 0.96, w / 2 + 0.01, groundH * 0.45, 0, "#1a2a3a",
    { metalness: 0.3, roughness: 0.2, emissive: "#0a1a2a", emissiveIntensity: 0.15 });
  addBox(group, 0.05, gh, d * 0.96, -w / 2 - 0.01, groundH * 0.45, 0, "#1a2a3a",
    { metalness: 0.3, roughness: 0.2, emissive: "#0a1a2a", emissiveIntensity: 0.15 });
  addBox(group, w * 0.96, gh, 0.05, 0, groundH * 0.45, -d / 2 - 0.01, "#1a2a3a",
    { metalness: 0.3, roughness: 0.2, emissive: "#0a1a2a", emissiveIntensity: 0.15 });

  // Upper floors
  const upperH = h - groundH;
  if (upperH > 0.5) {
    const tex = makeFacadeTexture("commercial", base, trim, win);
    addTexturedWall(group, w, upperH, d, groundH + upperH / 2, tex, shade(hexToRgb(base), -20));
    const floors = Math.max(1, Math.round(upperH / 1.5));
    addSillCourses(group, w, d, upperH, groundH, floors, 0.1, shade(hexToRgb(base), 20));
  }

  // Signage band
  addBox(group, w * 0.7, 0.2, 0.08, 0, groundH * 0.85, d / 2 + 0.02, "#ffaa00",
    { emissive: "#ff8800", emissiveIntensity: 0.4 });

  // Roof
  addCornice(group, w, d, h, 0.15, 0.2, shade(hexToRgb(base), -25));
  addBox(group, w * 0.2, 0.2, d * 0.2, w * 0.25, h + 0.15, -d * 0.2, "#555555");

  if (isLarge) {
    // HVAC units
    addBox(group, w * 0.15, 0.15, d * 0.15, -w * 0.2, h + 0.12, d * 0.15, "#666666");
    addCylinder(group, 0.08, 0.1, 0.3, w * 0.3, h + 0.25, d * 0.2, "#888888", 8);
  }
}

// ---- Industrial ----
function buildIndustrial(group, w, d, h, cfg) {
  const base = cfg.color;
  const trim = "#333333";
  const win = "#2a2a2a";

  const tex = makeFacadeTexture("industrial", base, trim, win);
  addTexturedWall(group, w, h, d, h / 2, tex, shade(hexToRgb(base), -25));

  // Sawtooth roof
  const ridges = Math.max(2, Math.floor(w / 1.5));
  for (let i = 0; i < ridges; i++) {
    const rx = -w / 2 + (i + 0.5) * (w / ridges);
    addBox(group, (w / ridges) * 0.8, 0.3, d * 0.3, rx, h + 0.15, 0, shade(hexToRgb(base), -30));
  }

  // Smokestacks
  addCylinder(group, 0.12, 0.18, h * 0.5, w * 0.3, h + h * 0.25, -d * 0.25, "#4a3a2a", 8);
  addCylinder(group, 0.1, 0.14, h * 0.4, -w * 0.25, h + h * 0.2, d * 0.25, "#3a2a1a", 8);

  // Loading dock
  addBox(group, w * 0.3, 0.6, 0.1, w * 0.2, 0.3, d / 2 + 0.05, shade(hexToRgb(base), -20));
  for (let i = 0; i < 2; i++) {
    addBox(group, w * 0.1, 0.5, 0.06, w * 0.1 + i * w * 0.12, 0.25, d / 2 + 0.06, "#1a1a1a",
      { metalness: 0.3, roughness: 0.3, emissive: "#0a0a1a", emissiveIntensity: 0.1 });
  }
}

// ---- Service buildings ----
function buildService(group, w, d, h, cfg, buildingId) {
  const base = cfg.color;
  const trim = "#222222";
  const win = "#2a3a4a";

  const tex = makeFacadeTexture("modern", base, trim, win);
  addTexturedWall(group, w, h, d, h / 2, tex, shade(hexToRgb(base), -20));

  const floors = Math.max(2, Math.round(h / 1.5));
  const bays = Math.max(2, Math.round(w / 1.5));
  addPilasters(group, w, d, h, 0, bays, 0.12, shade(hexToRgb(base), 20));
  addSillCourses(group, w, d, h, 0, floors, 0.08, shade(hexToRgb(base), 20));
  addCornice(group, w, d, h, 0.15, 0.2, shade(hexToRgb(base), -25));

  // Entrance
  addBox(group, 0.5, 1.0, 0.06, 0, 0.5, d / 2 + 0.02, trim);

  // Building-specific details
  if (buildingId === "hospital") {
    // Red cross sign
    addBox(group, 0.5, 0.12, 0.04, 0, h * 0.7, d / 2 + 0.03, "#ff0000",
      { emissive: "#ff0000", emissiveIntensity: 0.4 });
    addBox(group, 0.12, 0.5, 0.04, 0, h * 0.7, d / 2 + 0.03, "#ff0000",
      { emissive: "#ff0000", emissiveIntensity: 0.4 });
  } else if (buildingId === "fire_station") {
    // Wide garage door
    addBox(group, w * 0.5, h * 0.4, 0.06, 0, h * 0.2, d / 2 + 0.02, "#cc0000");
    addBox(group, w * 0.45, h * 0.35, 0.04, 0, h * 0.2, d / 2 + 0.03, "#1a1a1a",
      { metalness: 0.3, roughness: 0.3, emissive: "#0a0a1a", emissiveIntensity: 0.1 });
  } else if (buildingId === "police") {
    // Blue stripe
    addBox(group, w * 0.8, 0.15, 0.04, 0, h * 0.5, d / 2 + 0.02, "#3b46f6",
      { emissive: "#1a2af6", emissiveIntensity: 0.3 });
  } else if (buildingId === "school") {
    // Flag pole
    addCylinder(group, 0.02, 0.02, 1.5, w * 0.3, h + 0.75, d * 0.2, "#888888", 6);
    addBox(group, 0.4, 0.25, 0.01, w * 0.3 + 0.2, h + 1.25, d * 0.2, "#cc0000");
  } else if (buildingId === "power_plant") {
    // Cooling towers
    for (const [tx, tz] of [[w * 0.2, d * 0.2], [-w * 0.15, -d * 0.15]]) {
      addCylinder(group, 0.3, 0.4, h * 0.6, tx, h + h * 0.3, tz, "#888888", 12);
      addCylinder(group, 0.35, 0.35, 0.1, tx, h + h * 0.6, tz, "#666666", 12);
    }
    // Smokestacks
    addCylinder(group, 0.1, 0.15, h * 0.4, w * 0.3, h + h * 0.2, -d * 0.2, "#4a3a2a", 8);
  }
}

// ---- Main factory ----
export function createBuildingMesh(buildingId, cfg, height, size = [1, 1]) {
  const group = new THREE.Group();
  const w = size[0] * TILE_SIZE * 0.92;
  const d = size[1] * TILE_SIZE * 0.92;
  const h = Math.max(0.1, height);

  // Roads
  if (buildingId === "road" || buildingId.startsWith("road_")) {
    return createRoadMesh(group, buildingId);
  }

  // Specials
  if (buildingId === "park") return createParkMesh(group, w, d);
  if (buildingId === "solar_farm") return createSolarMesh(group, w, d, size);
  if (buildingId === "stadium") return createStadiumMesh(group, w, d, h, cfg);

  // Residential
  if (buildingId.startsWith("res_")) {
    if (["res_shack", "res_cabin"].includes(buildingId)) {
      buildSimpleHouse(group, w, d, h, cfg);
    } else if (["res_brownstone", "res_victorian", "res_townhouse", "res_cottage"].includes(buildingId)) {
      buildBrownstone(group, w, d, h, cfg);
    } else if (["res_tenement", "res_walkup", "res_midcentury", "res_brutalist", "res_soviet", "res_artdeco"].includes(buildingId)) {
      buildBrickBuilding(group, w, d, h, cfg);
    } else {
      buildModernResidential(group, w, d, h, cfg);
    }
    return group;
  }

  // Commercial
  if (buildingId.startsWith("commercial")) {
    buildCommercial(group, w, d, h, cfg, buildingId === "commercial_large");
    return group;
  }

  // Industrial
  if (buildingId.startsWith("industrial")) {
    buildIndustrial(group, w, d, h, cfg);
    return group;
  }

  // Service
  buildService(group, w, d, h, cfg, buildingId);
  return group;
}

export function disposeBuildingMesh(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (m.map && typeof m.map.dispose === "function") m.map.dispose();
        m.dispose();
      });
    }
  });
}

export function tileToWorld(row, col, size = [1, 1]) {
  return {
    x: col * TILE_SIZE + GRID_OFFSET_X + (size[0] * TILE_SIZE) / 2,
    z: row * TILE_SIZE + GRID_OFFSET_Z + (size[1] * TILE_SIZE) / 2,
  };
}
