// Grid dimensions
export const GRID_COLS = 80;
export const GRID_ROWS = 60;
export const TILE_SIZE = 40;

// Building types and their properties
export const BUILDINGS = {
  road: {
    id: "road",
    name: "Two-Lane Road",
    icon: "🛣️",
    category: "infrastructure",
    cost: 100,
    color: "#3a3a3a",
    borderColor: "#666",
    powerUsage: 0,
    populationAdd: 0,
    incomePerTick: 0,
    happinessEffect: 0,
  },
  road_twoway: {
    id: "road_twoway",
    name: "Two-Way Avenue",
    icon: "🛣️",
    category: "infrastructure",
    cost: 200,
    color: "#2a2a2a",
    borderColor: "#555",
    powerUsage: 0,
    populationAdd: 0,
    incomePerTick: 0,
    happinessEffect: 0,
  },
  road_sidewalk: {
    id: "road_sidewalk",
    name: "Sidewalk",
    icon: "🚶",
    category: "infrastructure",
    cost: 50,
    color: "#9a9a9a",
    borderColor: "#bbb",
    powerUsage: 0,
    populationAdd: 0,
    incomePerTick: 0,
    happinessEffect: 1,
  },
  road_highway: {
    id: "road_highway",
    name: "Highway",
    icon: "🛤️",
    category: "infrastructure",
    cost: 500,
    color: "#1a1a1a",
    borderColor: "#444",
    powerUsage: 0,
    populationAdd: 0,
    incomePerTick: 0,
    happinessEffect: -1,
  },
  res_shack: {
    id: "res_shack",
    name: "Shack",
    icon: "🏚️",
    category: "residential",
    cost: 300,
    color: "#8b7355",
    borderColor: "#6b5340",
    powerUsage: 0,
    populationAdd: 5,
    incomePerTick: -1,
    happinessEffect: -1,
    requiresRoadAdjacent: true,
  },
  res_cabin: {
    id: "res_cabin",
    name: "Wooden Cabin",
    icon: "🛖",
    category: "residential",
    cost: 500,
    color: "#a0826d",
    borderColor: "#80624d",
    powerUsage: 0,
    populationAdd: 8,
    incomePerTick: -1,
    happinessEffect: 0,
    requiresRoadAdjacent: true,
  },
  res_cottage: {
    id: "res_cottage",
    name: "Stone Cottage",
    icon: "🏠",
    category: "residential",
    cost: 800,
    color: "#a3a380",
    borderColor: "#83835f",
    powerUsage: 1,
    populationAdd: 12,
    incomePerTick: -2,
    happinessEffect: 1,
    requiresRoadAdjacent: true,
  },
  res_tenement: {
    id: "res_tenement",
    name: "Brick Tenement",
    icon: "🏚️",
    category: "residential",
    cost: 1200,
    color: "#9c6b4a",
    borderColor: "#7c4b2a",
    powerUsage: 1,
    populationAdd: 20,
    incomePerTick: -3,
    happinessEffect: -2,
    requiresRoadAdjacent: true,
  },
  res_brownstone: {
    id: "res_brownstone",
    name: "Brownstone",
    icon: "🏛️",
    category: "residential",
    cost: 1800,
    color: "#7a5c4e",
    borderColor: "#5a3c2e",
    powerUsage: 2,
    populationAdd: 30,
    incomePerTick: -3,
    happinessEffect: 1,
    requiresRoadAdjacent: true,
  },
  res_victorian: {
    id: "res_victorian",
    name: "Victorian House",
    icon: "🏚️",
    category: "residential",
    cost: 2500,
    color: "#a0522d",
    borderColor: "#80321d",
    powerUsage: 2,
    populationAdd: 35,
    incomePerTick: -4,
    happinessEffect: 2,
    requiresRoadAdjacent: true,
  },
  res_townhouse: {
    id: "res_townhouse",
    name: "Townhouse",
    icon: "🏠",
    category: "residential",
    cost: 3500,
    color: "#d4b896",
    borderColor: "#b49876",
    powerUsage: 2,
    populationAdd: 45,
    incomePerTick: -4,
    happinessEffect: 2,
    requiresRoadAdjacent: true,
  },
  res_walkup: {
    id: "res_walkup",
    name: "Walk-up Apartment",
    icon: "🏢",
    category: "residential",
    cost: 5000,
    color: "#e8dcc8",
    borderColor: "#c8bca8",
    powerUsage: 3,
    populationAdd: 60,
    incomePerTick: -5,
    happinessEffect: 1,
    requiresRoadAdjacent: true,
  },
  res_artdeco: {
    id: "res_artdeco",
    name: "Art Deco Apt",
    icon: "🏛️",
    category: "residential",
    cost: 7000,
    color: "#d4af37",
    borderColor: "#b48f17",
    powerUsage: 3,
    populationAdd: 80,
    incomePerTick: -6,
    happinessEffect: 3,
    requiresRoadAdjacent: true,
  },
  res_midcentury: {
    id: "res_midcentury",
    name: "Mid-century Block",
    icon: "🏢",
    category: "residential",
    cost: 9000,
    color: "#5f9ea0",
    borderColor: "#3f7e80",
    powerUsage: 4,
    populationAdd: 100,
    incomePerTick: -7,
    happinessEffect: 3,
    requiresRoadAdjacent: true,
  },
  res_brutalist: {
    id: "res_brutalist",
    name: "Brutalist Tower",
    icon: "🏢",
    category: "residential",
    cost: 12000,
    color: "#a9a9a9",
    borderColor: "#898989",
    powerUsage: 5,
    populationAdd: 130,
    incomePerTick: -8,
    happinessEffect: -1,
    requiresRoadAdjacent: true,
  },
  res_soviet: {
    id: "res_soviet",
    name: "Soviet Block",
    icon: "🏢",
    category: "residential",
    cost: 15000,
    color: "#b0b0b0",
    borderColor: "#909090",
    powerUsage: 5,
    populationAdd: 150,
    incomePerTick: -9,
    happinessEffect: -2,
    requiresRoadAdjacent: true,
  },
  res_garden: {
    id: "res_garden",
    name: "Garden Apartment",
    icon: "🏡",
    category: "residential",
    cost: 18000,
    color: "#7cc67c",
    borderColor: "#5ca65c",
    powerUsage: 6,
    populationAdd: 160,
    incomePerTick: -10,
    happinessEffect: 5,
    requiresRoadAdjacent: true,
  },
  res_modernist: {
    id: "res_modernist",
    name: "Modernist Block",
    icon: "🏢",
    category: "residential",
    cost: 22000,
    color: "#f0f0f0",
    borderColor: "#c0c0c0",
    powerUsage: 7,
    populationAdd: 180,
    incomePerTick: -11,
    happinessEffect: 4,
    requiresRoadAdjacent: true,
  },
  res_glass: {
    id: "res_glass",
    name: "Glass Tower",
    icon: "🏙️",
    category: "residential",
    cost: 28000,
    color: "#87ceeb",
    borderColor: "#67aebf",
    powerUsage: 8,
    populationAdd: 220,
    incomePerTick: -13,
    happinessEffect: 5,
    requiresRoadAdjacent: true,
  },
  res_condo: {
    id: "res_condo",
    name: "Condominium",
    icon: "🏙️",
    category: "residential",
    cost: 35000,
    color: "#4682b4",
    borderColor: "#266294",
    powerUsage: 9,
    populationAdd: 260,
    incomePerTick: -15,
    happinessEffect: 6,
    requiresRoadAdjacent: true,
  },
  res_penthouse: {
    id: "res_penthouse",
    name: "Luxury Penthouse",
    icon: "🏙️",
    category: "residential",
    cost: 45000,
    color: "#c0c0c0",
    borderColor: "#a0a0a0",
    powerUsage: 10,
    populationAdd: 300,
    incomePerTick: -18,
    happinessEffect: 10,
    requiresRoadAdjacent: true,
  },
  res_eco: {
    id: "res_eco",
    name: "Eco Apartment",
    icon: "🌱",
    category: "residential",
    cost: 55000,
    color: "#2ecc71",
    borderColor: "#1eac51",
    powerUsage: 6,
    populationAdd: 320,
    incomePerTick: -16,
    happinessEffect: 8,
    requiresRoadAdjacent: true,
  },
  res_smart: {
    id: "res_smart",
    name: "Smart Tower",
    icon: "🏙️",
    category: "residential",
    cost: 70000,
    color: "#00ced1",
    borderColor: "#00aeae",
    powerUsage: 12,
    populationAdd: 400,
    incomePerTick: -22,
    happinessEffect: 9,
    requiresRoadAdjacent: true,
  },
  res_futuristic: {
    id: "res_futuristic",
    name: "Futuristic Skyscraper",
    icon: "🏙️",
    category: "residential",
    cost: 100000,
    color: "#9b59b6",
    borderColor: "#7b3986",
    powerUsage: 15,
    populationAdd: 500,
    incomePerTick: -30,
    happinessEffect: 12,
    requiresRoadAdjacent: true,
  },
  commercial_small: {
    id: "commercial_small",
    name: "Shop",
    icon: "🏪",
    category: "commercial",
    cost: 1000,
    color: "#60a5fa",
    borderColor: "#3b82f6",
    powerUsage: 2,
    populationAdd: 0,
    incomePerTick: 15,
    happinessEffect: 2,
    requiresRoadAdjacent: true,
  },
  commercial_large: {
    id: "commercial_large",
    name: "Mall",
    icon: "🏬",
    category: "commercial",
    cost: 5000,
    color: "#3b82f6",
    borderColor: "#2563eb",
    powerUsage: 6,
    populationAdd: 0,
    incomePerTick: 50,
    happinessEffect: 5,
    requiresRoadAdjacent: true,
  },
  industrial_small: {
    id: "industrial_small",
    name: "Factory",
    icon: "🏭",
    category: "industrial",
    cost: 1500,
    color: "#facc15",
    borderColor: "#eab308",
    powerUsage: 4,
    populationAdd: 0,
    incomePerTick: 25,
    happinessEffect: -3,
    requiresRoadAdjacent: true,
  },
  industrial_large: {
    id: "industrial_large",
    name: "Warehouse",
    icon: "📦",
    category: "industrial",
    cost: 3000,
    color: "#ca8a04",
    borderColor: "#a16207",
    powerUsage: 5,
    populationAdd: 0,
    incomePerTick: 40,
    happinessEffect: -5,
    requiresRoadAdjacent: true,
  },
  power_plant: {
    id: "power_plant",
    name: "Power Plant",
    icon: "⚡",
    category: "services",
    cost: 10000,
    color: "#f97316",
    borderColor: "#ea580c",
    powerUsage: 0,
    powerGeneration: 50,
    populationAdd: 0,
    incomePerTick: -20,
    happinessEffect: -2,
  },
  solar_farm: {
    id: "solar_farm",
    name: "Solar Farm",
    icon: "☀️",
    category: "services",
    cost: 15000,
    color: "#fbbf24",
    borderColor: "#f59e0b",
    powerUsage: 0,
    powerGeneration: 30,
    populationAdd: 0,
    incomePerTick: -10,
    happinessEffect: 2,
  },
  police: {
    id: "police",
    name: "Police Station",
    icon: "🚔",
    category: "services",
    cost: 3000,
    color: "#818cf8",
    borderColor: "#6366f1",
    powerUsage: 3,
    populationAdd: 0,
    incomePerTick: -10,
    happinessEffect: 8,
    requiresRoadAdjacent: true,
  },
  fire_station: {
    id: "fire_station",
    name: "Fire Station",
    icon: "🚒",
    category: "services",
    cost: 3000,
    color: "#f87171",
    borderColor: "#ef4444",
    powerUsage: 3,
    populationAdd: 0,
    incomePerTick: -10,
    happinessEffect: 8,
    requiresRoadAdjacent: true,
  },
  hospital: {
    id: "hospital",
    name: "Hospital",
    icon: "🏥",
    category: "services",
    cost: 8000,
    color: "#fb7185",
    borderColor: "#e11d48",
    powerUsage: 6,
    populationAdd: 0,
    incomePerTick: -25,
    happinessEffect: 15,
    requiresRoadAdjacent: true,
  },
  school: {
    id: "school",
    name: "School",
    icon: "🏫",
    category: "services",
    cost: 4000,
    color: "#a78bfa",
    borderColor: "#8b5cf6",
    powerUsage: 3,
    populationAdd: 0,
    incomePerTick: -15,
    happinessEffect: 10,
    requiresRoadAdjacent: true,
  },
  park: {
    id: "park",
    name: "Park",
    icon: "🌳",
    category: "decoration",
    cost: 500,
    color: "#86efac",
    borderColor: "#4ade80",
    powerUsage: 0,
    populationAdd: 0,
    incomePerTick: -1,
    happinessEffect: 5,
  },
  stadium: {
    id: "stadium",
    name: "Stadium",
    icon: "🏟️",
    category: "decoration",
    cost: 15000,
    color: "#c084fc",
    borderColor: "#a855f7",
    powerUsage: 10,
    populationAdd: 0,
    incomePerTick: 30,
    happinessEffect: 20,
    requiresRoadAdjacent: true,
  },
};

// Building footprint sizes [width, height] in tiles — varied non-square shapes
export const BUILDING_SIZES = {
  road: [1, 1],
  road_twoway: [1, 1],
  road_sidewalk: [1, 1],
  road_highway: [1, 1],
  res_shack: [1, 1],
  res_cabin: [1, 2],
  res_cottage: [2, 2],
  res_tenement: [2, 3],
  res_brownstone: [2, 3],
  res_victorian: [2, 2],
  res_townhouse: [2, 4],
  res_walkup: [3, 2],
  res_artdeco: [2, 3],
  res_midcentury: [4, 3],
  res_brutalist: [3, 4],
  res_soviet: [4, 3],
  res_garden: [3, 2],
  res_modernist: [3, 4],
  res_glass: [2, 3],
  res_condo: [3, 3],
  res_penthouse: [2, 2],
  res_eco: [3, 3],
  res_smart: [2, 3],
  res_futuristic: [2, 2],
  commercial_small: [2, 3],
  commercial_large: [4, 5],
  industrial_small: [3, 4],
  industrial_large: [5, 4],
  power_plant: [4, 4],
  solar_farm: [5, 3],
  police: [2, 2],
  fire_station: [2, 3],
  hospital: [3, 4],
  school: [4, 3],
  park: [3, 2],
  stadium: [6, 4],
};

export function getBuildingSize(id) {
  return BUILDING_SIZES[id] || [1, 1];
}

// Check if a building of given size can be placed at (row, col) — all tiles must be empty
export function canPlaceAt(grid, row, col, size) {
  const [w, h] = size;
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return false;
      if (grid[r][c] !== null) return false;
    }
  }
  return true;
}

// Check if any tile around the footprint perimeter has an adjacent road
export function hasAdjacentRoadFootprint(grid, row, col, size) {
  const [w, h] = size;
  for (let dr = -1; dr <= h; dr++) {
    for (let dc = -1; dc <= w; dc++) {
      if (dr === -1 || dr === h || dc === -1 || dc === w) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
          if (isRoad(grid[r][c])) return true;
        }
      }
    }
  }
  return false;
}

// Place a building origin + mark occupied tiles. Returns new grid.
export function placeBuilding(grid, row, col, buildingId) {
  const size = getBuildingSize(buildingId);
  const [w, h] = size;
  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = { id: buildingId, o: [row, col], s: size };
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      if (dr === 0 && dc === 0) continue;
      newGrid[row + dr][col + dc] = { occ: [row, col] };
    }
  }
  return newGrid;
}

// Remove a building at (row, col) — traces to origin, clears full footprint. Returns new grid.
export function removeBuilding(grid, row, col) {
  const cell = grid[row]?.[col];
  if (!cell || cell === "road") return grid;

  let originRow, originCol, size;
  if (cell.occ) {
    [originRow, originCol] = cell.occ;
    const originCell = grid[originRow]?.[originCol];
    if (!originCell?.id) return grid;
    size = originCell.s || getBuildingSize(originCell.id);
  } else if (cell.id) {
    originRow = row;
    originCol = col;
    size = cell.s || getBuildingSize(cell.id);
  } else {
    return grid;
  }

  const [w, h] = size;
  const newGrid = grid.map(r => [...r]);
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      const r = originRow + dr;
      const c = originCol + dc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        newGrid[r][c] = null;
      }
    }
  }
  return newGrid;
}

// Get building info at a tile (returns {id, originRow, originCol, size} or null)
export function getBuildingAt(grid, row, col) {
  const cell = grid[row]?.[col];
  if (!cell || isRoad(cell)) return null;
  if (cell.occ) {
    const [or, oc] = cell.occ;
    const originCell = grid[or]?.[oc];
    if (originCell?.id) {
      return { id: originCell.id, originRow: or, originCol: oc, size: originCell.s || getBuildingSize(originCell.id) };
    }
    return null;
  }
  if (cell.id) {
    return { id: cell.id, originRow: row, originCol: col, size: cell.s || getBuildingSize(cell.id) };
  }
  return null;
}

// Check if a grid cell is a road (handles both string and object formats, all road types)
export function isRoad(cell) {
  if (cell === "road") return true;
  if (cell && typeof cell === "object" && cell.id && cell.id.startsWith("road")) return true;
  return false;
}

export const CATEGORIES = [
  { id: "infrastructure", name: "Roads", icon: "🛣️" },
  { id: "residential", name: "Residential", icon: "🏠" },
  { id: "commercial", name: "Commercial", icon: "🏪" },
  { id: "industrial", name: "Industrial", icon: "🏭" },
  { id: "services", name: "Services", icon: "⚡" },
  { id: "decoration", name: "Parks", icon: "🌳" },
];

// Create an empty grid
export function createEmptyGrid() {
  const grid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push(null);
    }
    grid.push(row);
  }
  return grid;
}

// Normalize a parsed grid to current dimensions (pad/truncate).
// Handles old string-format buildings, object-format buildings, and roads.
export function normalizeGrid(raw) {
  const grid = createEmptyGrid();
  if (!raw) return grid;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const val = raw[r]?.[c];
      if (!val) continue;
      if (val === "road") {
        grid[r][c] = { id: "road", o: [r, c], s: [1, 1] };
      } else if (typeof val === "string" && BUILDINGS[val]) {
        // Old format: plain string → convert to 1x1 origin
        grid[r][c] = { id: val, o: [r, c], s: [1, 1] };
      } else if (typeof val === "object") {
        if (val.id && BUILDINGS[val.id]) {
          grid[r][c] = { id: val.id, o: val.o || [r, c], s: val.s || getBuildingSize(val.id) };
        } else if (val.occ) {
          grid[r][c] = { occ: val.occ };
        }
      }
    }
  }
  return grid;
}

// Check if a tile has an adjacent road
export function hasAdjacentRoad(grid, row, col) {
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
      if (isRoad(grid[nr][nc])) return true;
    }
  }
  return false;
}

// Calculate city stats from grid (only counts building origins, not occupied tiles)
export function calculateStats(grid) {
  let population = 0;
  let incomePerTick = 0;
  let happiness = 50;
  let powerUsage = 0;
  let powerCapacity = 0;
  let buildingCount = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      if (!cell || isRoad(cell) || cell.occ) continue;
      if (!cell.id) continue;
      const b = BUILDINGS[cell.id];
      if (!b) continue;
      population += b.populationAdd;
      incomePerTick += b.incomePerTick;
      happiness += b.happinessEffect;
      powerUsage += b.powerUsage;
      powerCapacity += b.powerGeneration || 0;
      buildingCount++;
    }
  }

  happiness = Math.max(0, Math.min(100, happiness));
  if (powerUsage > powerCapacity && buildingCount > 0) {
    happiness = Math.max(0, happiness - 20);
  }

  return { population, incomePerTick, happiness, powerUsage, powerCapacity, buildingCount };
}
