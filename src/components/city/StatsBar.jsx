import React from "react";
import { Users, DollarSign, Smile, Zap, Building2 } from "lucide-react";

export default function StatsBar({ money, population, happiness, incomePerTick, powerUsage, powerCapacity, buildingCount, cityName, onNameChange }) {
  const powerOk = powerCapacity >= powerUsage;

  return (
    <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex items-center gap-6 overflow-x-auto">
      {/* City name */}
      <input
        value={cityName}
        onChange={(e) => onNameChange(e.target.value)}
        className="bg-transparent text-white font-bold text-lg border-b border-transparent hover:border-slate-500 focus:border-sky-400 focus:outline-none transition-colors w-36 shrink-0"
      />

      <div className="h-6 w-px bg-slate-700 shrink-0" />

      {/* Money */}
      <div className="flex items-center gap-2 shrink-0">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <span className="text-emerald-400 font-mono font-semibold text-sm">
          ${money.toLocaleString()}
        </span>
        <span className={`text-xs font-mono ${incomePerTick >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
          ({incomePerTick >= 0 ? '+' : ''}{incomePerTick}/s)
        </span>
      </div>

      {/* Population */}
      <div className="flex items-center gap-2 shrink-0">
        <Users className="w-4 h-4 text-sky-400" />
        <span className="text-sky-400 font-mono font-semibold text-sm">
          {population.toLocaleString()}
        </span>
      </div>

      {/* Happiness */}
      <div className="flex items-center gap-2 shrink-0">
        <Smile className={`w-4 h-4 ${happiness > 60 ? 'text-emerald-400' : happiness > 30 ? 'text-yellow-400' : 'text-red-400'}`} />
        <span className={`font-mono font-semibold text-sm ${happiness > 60 ? 'text-emerald-400' : happiness > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          {happiness}%
        </span>
      </div>

      {/* Power */}
      <div className="flex items-center gap-2 shrink-0">
        <Zap className={`w-4 h-4 ${powerOk ? 'text-yellow-400' : 'text-red-400 animate-pulse'}`} />
        <span className={`font-mono font-semibold text-sm ${powerOk ? 'text-yellow-400' : 'text-red-400'}`}>
          {powerUsage}/{powerCapacity}
        </span>
      </div>

      {/* Buildings */}
      <div className="flex items-center gap-2 shrink-0">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="text-slate-400 font-mono font-semibold text-sm">
          {buildingCount}
        </span>
      </div>
    </div>
  );
}
