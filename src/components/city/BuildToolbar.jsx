import React, { useState } from "react";
import { BUILDINGS, CATEGORIES } from "@/lib/gameConfig";
import { Eraser, Waypoints } from "lucide-react";

export default function BuildToolbar({ selectedTool, onSelectTool, money, onRoadMode }) {
  const [activeCategory, setActiveCategory] = useState("residential");

  const categoryBuildings = Object.values(BUILDINGS).filter(
    (b) => b.category === activeCategory && !b.id.startsWith("road")
  );

  return (
    <div className="bg-slate-900 border-t border-slate-700">
      {/* Categories */}
      <div className="flex items-center border-b border-slate-800 px-2">
        {CATEGORIES.filter((c) => c.id !== "infrastructure").map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 border-b-2 ${
              activeCategory === cat.id
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-sm">{cat.icon}</span>
            <span className="hidden sm:inline">{cat.name}</span>
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onRoadMode}
            className="px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 border-b-2 border-transparent text-sky-400 hover:text-sky-300"
          >
            <Waypoints className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Road Tool</span>
          </button>
          <button
            onClick={() => onSelectTool("demolish")}
            className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 border-b-2 ${
              selectedTool === "demolish"
                ? "border-red-400 text-red-400"
                : "border-transparent text-slate-400 hover:text-red-300"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demolish</span>
          </button>
        </div>
      </div>

      {/* Buildings in category */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {categoryBuildings.map((building) => {
          const canAfford = money >= building.cost;
          const isSelected = selectedTool === building.id;
          return (
            <button
              key={building.id}
              onClick={() => onSelectTool(building.id)}
              disabled={!canAfford}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs transition-all shrink-0 min-w-[72px] ${
                isSelected
                  ? "bg-sky-500/20 ring-1 ring-sky-400 text-sky-300"
                  : canAfford
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
              }`}
            >
              <span className="text-xl">{building.icon}</span>
              <span className="font-medium leading-tight text-center">{building.name}</span>
              <span className={`font-mono text-[10px] ${canAfford ? "text-emerald-400" : "text-red-400"}`}>
                ${building.cost.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
