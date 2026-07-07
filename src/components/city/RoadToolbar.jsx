import React from "react";
import { ROAD_TYPES } from "@/lib/roadNetwork";
import { Eraser, ArrowLeft, Ruler, Spline, Check, Trash2 } from "lucide-react";

export default function RoadToolbar({
  roadType,
  onRoadTypeChange,
  roadMode,
  onRoadModeChange,
  roadAction,
  onRoadActionChange,
  onFinishPath,
  onBackToBuild,
}) {
  const roadTypeList = Object.values(ROAD_TYPES);

  return (
    <div className="bg-slate-900 border-t border-slate-700">
      {/* Top row: controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        <button
          onClick={onBackToBuild}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Buildings</span>
        </button>

        <div className="h-5 w-px bg-slate-700 shrink-0" />

        {/* Straight / Curved toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => onRoadModeChange("straight")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              roadMode === "straight"
                ? "bg-sky-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Ruler className="w-3 h-3" />
            Straight
          </button>
          <button
            onClick={() => onRoadModeChange("curved")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              roadMode === "curved"
                ? "bg-sky-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Spline className="w-3 h-3" />
            Curved
          </button>
        </div>

        {/* Draw / Delete toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => onRoadActionChange("draw")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              roadAction === "draw"
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => onRoadActionChange("delete")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              roadAction === "delete"
                ? "bg-red-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>

        <button
          onClick={onFinishPath}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 transition-colors shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Finish Path</span>
        </button>

        <div className="ml-auto text-[10px] text-slate-500 shrink-0 hidden md:block">
          Click to add nodes · Drag nodes to reshape · Double-click to finish
        </div>
      </div>

      {/* Bottom row: road types */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {roadTypeList.map((rt) => {
          const isSelected = roadType === rt.id;
          return (
            <button
              key={rt.id}
              onClick={() => onRoadTypeChange(rt.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs transition-all shrink-0 min-w-[80px] ${
                isSelected
                  ? "bg-sky-500/20 ring-1 ring-sky-400 text-sky-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              <span className="text-xl">{rt.icon}</span>
              <span className="font-medium leading-tight text-center">{rt.name}</span>
              <span className="font-mono text-[10px] text-emerald-400">${rt.cost.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
