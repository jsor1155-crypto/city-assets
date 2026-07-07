import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  BUILDINGS,
  createEmptyGrid,
  calculateStats,
  normalizeGrid,
  getBuildingSize,
  canPlaceAt,
  hasAdjacentRoadFootprint,
  placeBuilding,
  removeBuilding,
  getBuildingAt,
  isRoad,
  GRID_COLS,
  GRID_ROWS,
} from "@/lib/gameConfig";
import { tileToWorld } from "@/lib/buildingFactory";
import {
  createEmptyRoadData,
  serializeRoadData,
  deserializeRoadData,
  isNearRoad,
  isBuildingOnRoad,
} from "@/lib/roadNetwork";
import StatsBar from "@/components/city/StatsBar";
import BuildToolbar from "@/components/city/BuildToolbar";
import RoadToolbar from "@/components/city/RoadToolbar";
import CityGrid3D from "@/components/city/CityGrid3D";

const STARTING_MONEY = 50000;
const TICK_INTERVAL = 2000;

export default function Home() {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [selectedTool, setSelectedTool] = useState(null);
  const [money, setMoney] = useState(STARTING_MONEY);
  const [cityName, setCityName] = useState("New City");
  const [cityStateId, setCityStateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState("build");
  const [roadData, setRoadData] = useState(createEmptyRoadData());
  const [roadType, setRoadType] = useState("two_lane");
  const [roadMode, setRoadMode] = useState("straight");
  const [roadAction, setRoadAction] = useState("draw");
  const [finishPathCounter, setFinishPathCounter] = useState(0);
  const tickCountRef = useRef(0);

  const stats = calculateStats(grid);

  // Load or create city state on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await base44.entities.CityState.list("-created_date", 1);
        if (!cancelled && existing && existing.length > 0) {
          const city = existing[0];
          setCityStateId(city.id);
          setMoney(city.money ?? STARTING_MONEY);
          setCityName(city.city_name || "New City");
          if (city.grid_data) {
            try {
              setGrid(normalizeGrid(JSON.parse(city.grid_data)));
            } catch {}
          }
          if (city.road_data) {
            setRoadData(deserializeRoadData(city.road_data));
          }
          if (city.tick_count) tickCountRef.current = city.tick_count;
        } else if (!cancelled) {
          const created = await base44.entities.CityState.create({
            city_name: "New City",
            money: STARTING_MONEY,
            grid_data: JSON.stringify(createEmptyGrid()),
            road_data: serializeRoadData(createEmptyRoadData()),
          });
          setCityStateId(created.id);
        }
      } catch {
        setErrorMessage("Could not load your city. You can still play — progress saves when possible.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Economy tick
  useEffect(() => {
    const interval = setInterval(() => {
      tickCountRef.current++;
      setMoney((prev) => {
        const s = calculateStats(grid);
        const next = prev + s.incomePerTick;
        const taxBonus = Math.floor(s.population * 0.1 * (s.happiness / 100));
        return Math.max(0, next + taxBonus);
      });
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [grid]);

  // Save city state periodically
  const saveCity = useCallback(async () => {
    if (!cityStateId) return;
    try {
      await base44.entities.CityState.update(cityStateId, {
        money,
        city_name: cityName,
        grid_data: JSON.stringify(grid),
        road_data: serializeRoadData(roadData),
        population: stats.population,
        happiness: stats.happiness,
        power: stats.powerUsage,
        power_capacity: stats.powerCapacity,
        tick_count: tickCountRef.current,
      });
    } catch {}
  }, [cityStateId, money, cityName, grid, roadData, stats]);

  useEffect(() => {
    if (!cityStateId || isLoading) return;
    const interval = setInterval(saveCity, 10000);
    return () => clearInterval(interval);
  }, [saveCity, cityStateId, isLoading]);

  // Handle tile click — place or demolish (build mode only)
  const handleTileClick = useCallback(
    (row, col) => {
      setGrid((prevGrid) => {
        const tool = selectedTool;

        if (tool === "demolish") {
          const cell = prevGrid[row][col];
          if (!cell) return prevGrid;
          if (isRoad(cell)) {
            const newGrid = prevGrid.map((r) => [...r]);
            newGrid[row][col] = null;
            setMoney((m) => m + Math.floor(BUILDINGS.road.cost * 0.25));
            return newGrid;
          }
          const building = getBuildingAt(prevGrid, row, col);
          if (!building) return prevGrid;
          const newGrid = removeBuilding(prevGrid, row, col);
          const b = BUILDINGS[building.id];
          if (b) setMoney((m) => m + Math.floor(b.cost * 0.25));
          return newGrid;
        }

        if (!BUILDINGS[tool]) return prevGrid;

        const building = BUILDINGS[tool];
        const size = getBuildingSize(tool);

        if (!canPlaceAt(prevGrid, row, col, size)) {
          setErrorMessage("Not enough space to place building here.");
          return prevGrid;
        }
        if (money < building.cost) return prevGrid;

        // Prevent placing buildings on top of spline roads
        const { x: bx, z: bz } = tileToWorld(row, col, size);
        if (isBuildingOnRoad(roadData, bx, bz, size[0], size[1])) {
          setErrorMessage("Cannot place building on a road.");
          return prevGrid;
        }

        // Road adjacency: check grid roads AND spline roads
        if (building.requiresRoadAdjacent) {
          const hasGridRoad = hasAdjacentRoadFootprint(prevGrid, row, col, size);
          const { x, z } = tileToWorld(row, col, size);
          const hasSplineRoad = isNearRoad(roadData, x, z, 6);
          if (!hasGridRoad && !hasSplineRoad) {
            setErrorMessage(`${building.name} must be placed near a road.`);
            return prevGrid;
          }
        }

        const newGrid = placeBuilding(prevGrid, row, col, tool);
        setMoney((m) => m - building.cost);
        setErrorMessage("");
        return newGrid;
      });
    },
    [selectedTool, money, roadData]
  );

  const handleRoadChange = useCallback((newRoadData) => {
    setRoadData(newRoadData);
  }, []);

  const handleFinishPath = useCallback(() => {
    setFinishPathCounter((c) => c + 1);
  }, []);

  const clearErrorMessage = useCallback(() => setErrorMessage(""), []);
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(clearErrorMessage, 3000);
    return () => clearTimeout(t);
  }, [errorMessage, clearErrorMessage]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading your city...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950">
      <StatsBar
        money={money}
        population={stats.population}
        happiness={stats.happiness}
        incomePerTick={stats.incomePerTick}
        powerUsage={stats.powerUsage}
        powerCapacity={stats.powerCapacity}
        buildingCount={stats.buildingCount}
        cityName={cityName}
        onNameChange={setCityName}
      />

      {errorMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-red-900/90 border border-red-600 text-red-200 px-4 py-2 rounded-lg text-sm shadow-lg">
          {errorMessage}
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <CityGrid3D
          grid={grid}
          selectedTool={selectedTool}
          onTileClick={handleTileClick}
          money={money}
          mode={mode}
          roadData={roadData}
          roadType={roadType}
          roadMode={roadMode}
          roadAction={roadAction}
          onRoadChange={handleRoadChange}
          finishPathCounter={finishPathCounter}
        />
      </div>

      {mode === "build" ? (
        <BuildToolbar
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          money={money}
          onRoadMode={() => setMode("road")}
        />
      ) : (
        <RoadToolbar
          roadType={roadType}
          onRoadTypeChange={setRoadType}
          roadMode={roadMode}
          onRoadModeChange={setRoadMode}
          roadAction={roadAction}
          onRoadActionChange={setRoadAction}
          onFinishPath={handleFinishPath}
          onBackToBuild={() => setMode("build")}
        />
      )}
    </div>
  );
}
