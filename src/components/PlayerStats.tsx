import React, { useState } from "react";
import { MatchState, Player } from "../types.js";
import { Users, Crosshair, Award, Map } from "lucide-react";

interface PlayerStatsProps {
  matchState: MatchState;
  onSelectPlayerId: (id: string | null) => void;
  selectedPlayerId: string | null;
}

export default function PlayerStats({
  matchState,
  onSelectPlayerId,
  selectedPlayerId,
}: PlayerStatsProps) {
  const [activeTab, setActiveTab] = useState<"home" | "away">("home");

  const team = activeTab === "home" ? matchState.homeTeam : matchState.awayTeam;

  return (
    <div id="player-statistics-panel" className="bg-[#0c0c0e] border border-white/10 rounded-xl p-3.5 shadow-xl">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.55">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <h3 className="text-[11px] font-bold tracking-widest text-slate-500 font-mono uppercase text-left">
            LIVE ROSTER RATINGS
          </h3>
        </div>

        {/* Team selectors */}
        <div className="flex bg-white/5 border border-white/5 p-0.5 rounded">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === "home"
                ? "bg-white/10 text-white"
                : "text-slate-500 hover:text-slate-350"
            }`}
          >
            {matchState.homeTeam.name.split(" ")[0]}
          </button>
          <button
            onClick={() => setActiveTab("away")}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === "away"
                ? "bg-indigo-600 text-white font-bold"
                : "text-slate-500 hover:text-slate-350"
            }`}
          >
            {matchState.awayTeam.name.split(" ").slice(-1)[0]}
          </button>
        </div>
      </div>

      <p className="text-[9.5px] font-mono text-slate-500 text-left mb-3.5 italic leading-tight">
        💡 Hover or click any card to highlight coverage heatmaps on the tactical radar pitch coordinates.
      </p>

      {/* Grid List representation of players */}
      <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
        {team.roster && team.roster.length > 0 ? (
          team.roster.map((player) => {
            const isSelected = selectedPlayerId === player.id;
            
            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayerId(isSelected ? null : player.id)}
                className={`border rounded-lg p-2.5 flex flex-col transition cursor-pointer ${
                  isSelected
                    ? "bg-white/10 border-indigo-500"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded bg-[#0c0c0e] border border-white/5 text-[9px] font-bold font-mono text-slate-400 flex items-center justify-center">
                      {player.number}
                    </span>
                    <div className="text-left font-mono leading-none">
                      <span className="text-[11px] font-bold text-slate-200 block truncate max-w-[120px]">
                        {player.name}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 mt-0.5 block">
                        {player.position}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="text-[8px] font-mono text-emerald-450 flex items-center gap-0.5 bg-emerald-500/10 px-1 rounded border border-emerald-500/10">
                        <Map className="w-2 h-2" /> Heatmap
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded leading-none ${
                        player.rating >= 8.0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                          : player.rating >= 7.2
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/15"
                          : "bg-white/5 text-slate-400 border border-white/5"
                      }`}
                    >
                      ★ {player.rating}
                    </span>
                  </div>
                </div>

                {/* Substats bar expanded always */}
                <div className="grid grid-cols-4 gap-0.5 border-t border-white/5 mt-2 pt-1.5 text-[9.5px] font-mono text-slate-500 text-center">
                  <div>
                    <span className="block text-slate-350 font-bold">{player.stats.goals}</span>
                    <span className="text-[8px] uppercase text-slate-500">Goals</span>
                  </div>
                  <div>
                    <span className="block text-slate-350 font-bold">{player.stats.assists}</span>
                    <span className="text-[8px] uppercase text-slate-500">Assists</span>
                  </div>
                  <div>
                    <span className="block text-slate-350 font-bold">{player.stats.passAccuracy}%</span>
                    <span className="text-[8px] uppercase text-slate-500">Pass Acc</span>
                  </div>
                  <div>
                    <span className="block text-slate-350 font-bold">{player.stats.tackles}</span>
                    <span className="text-[8px] uppercase text-slate-500">Tackles</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 border border-dashed border-white/5 rounded text-center font-mono text-[10px] text-slate-500">
            Click on Live Match above to study real-time player lineups!
          </div>
        )}
      </div>
    </div>
  );
}
