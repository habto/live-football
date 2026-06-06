import React, { useState } from "react";
import { PlayerCoord } from "../types.js";

interface PitchMinimapProps {
  players: PlayerCoord[];
  ball: { x: number; y: number };
  homeTeamColor: string;
  awayTeamColor: string;
  onSelectPlayer: (id: string, name: string, team: "home" | "away") => void;
  selectedPlayerId: string | null;
}

export default function PitchMinimap({
  players,
  ball,
  onSelectPlayer,
  selectedPlayerId,
}: PitchMinimapProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerCoord | null>(null);

  // Translate server 0..100 coords to field percentage coordinates
  // Server: X goes 0..100 (left goal to right goal), Y goes 0..100 (top to bottom touchline)
  // Let us build a fluid SVG field with width 100% and height 100% inside an aspect-ratio container
  return (
    <div id="tactical-board-panel" className="bg-[#0c0c0e] border border-white/10 rounded-xl p-3.5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-500 font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          TACTICAL RADAR VIEW
        </h3>
        {selectedPlayerId && (
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Heatmap Active
          </span>
        )}
      </div>

      {/* Main Pitch Frame */}
      <div className="relative w-full aspect-[5/3] bg-emerald-950 rounded-xl overflow-hidden border border-emerald-900 shadow-inner">
        {/* Pitch Green Grass Striping */}
        <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 w-full ${
                i % 2 === 0 ? "bg-[#14532d]" : "bg-[#115e3b]"
              } opacity-40`}
            ></div>
          ))}
        </div>

        {/* Pitch Vector Overlay lines */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full select-none"
          preserveAspectRatio="none"
        >
          {/* Outlines */}
          <rect x="4" y="4" width="92" height="92" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          
          {/* Halfway Line */}
          <line x1="50" y1="4" x2="50" y2="96" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          
          {/* Center Circle */}
          <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="0.6" fill="rgba(255,255,255,0.4)" />

          {/* Left Penalty Area */}
          <rect x="4" y="24" width="14" height="52" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          {/* Left Goal Area */}
          <rect x="4" y="38" width="5" height="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          {/* Left Penalty Spot */}
          <circle cx="14" cy="50" r="0.4" fill="white" />
          {/* Left Penalty Arc */}
          <path d="M 18,42 A 10,10 0 0,1 18,58" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />

          {/* Right Penalty Area */}
          <rect x="82" y="24" width="14" height="52" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          {/* Right Goal Area */}
          <rect x="91" y="38" width="5" height="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
          {/* Right Penalty Spot */}
          <circle cx="86" cy="50" r="0.4" fill="white" />
          {/* Right Penalty Arc */}
          <path d="M 82,42 A 10,10 0 0,0 82,58" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />

          {/* Corner Arcs */}
          <path d="M 4,7 A 3,3 0 0,0 7,4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
          <path d="M 4,93 A 3,3 0 0,1 7,96" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
          <path d="M 96,7 A 3,3 0 0,1 93,4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
          <path d="M 96,93 A 3,3 0 0,0 93,96" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
          
          {/* Goal posts (Physical mesh representations) */}
          <rect x="1.5" y="44" width="2.5" height="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <rect x="96" y="44" width="2.5" height="12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />

          {/* Generated heat map backdrop (only if a player is selected) */}
          {selectedPlayerId && (
            <g opacity="0.35">
              {/* Overlay standard Gaussian hotzones mapped loosely to player position */}
              {players
                .filter(p => p.id === selectedPlayerId)
                .map((p) => {
                  const xBase = p.team === "home" ? p.x : p.x;
                  const yBase = p.y;
                  return (
                    <g key="heatmap-spot">
                      {/* Active zone blobs */}
                      <circle cx={xBase} cy={yBase} r="16" fill="url(#heatGradientLarge)" />
                      <circle cx={xBase + (p.team === "home" ? -8 : 8)} cy={Math.max(10, Math.min(90, yBase + 10))} r="10" fill="url(#heatGradientMedium)" />
                      <circle cx={xBase + (p.team === "home" ? 5 : -5)} cy={Math.max(10, Math.min(90, yBase - 8))} r="12" fill="url(#heatGradientMedium)" />
                      <circle cx={xBase} cy={yBase} r="6" fill="url(#heatGradientHot)" />
                    </g>
                  );
                })}
            </g>
          )}

          {/* Define Color Gradients */}
          <defs>
            <radialGradient id="heatGradientLarge" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatGradientMedium" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatGradientHot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="20%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Dynamic Interactive Players Markers */}
        {players.map((p) => {
          const isSelected = selectedPlayerId === p.id;
          const isHome = p.team === "home";
          
          return (
            <button
              key={p.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-bold transition-all duration-300 shadow-md cursor-pointer ${
                isHome
                  ? "bg-slate-100 border-slate-400 text-slate-900 hover:bg-white"
                  : "bg-sky-400 border-sky-300 text-slate-900 hover:bg-sky-300"
              } ${
                isSelected
                  ? "ring-4 ring-offset-2 ring-emerald-400 ring-offset-emerald-950 scale-125 z-20"
                  : "hover:scale-115 z-10"
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onMouseEnter={() => setHoveredPlayer(p)}
              onMouseLeave={() => setHoveredPlayer(null)}
              onClick={() => onSelectPlayer(p.id, p.name, p.team)}
              title={p.name}
            >
              <div id={`player-marker-${p.id}`} className="relative h-full w-full flex items-center justify-center">
                <span>{p.number}</span>
                {/* Positional Dot overlay */}
                <div
                  className={`absolute -bottom-1 right-0 w-1.5 h-1.5 rounded-full border border-slate-900 ${
                    p.position === "FWD"
                      ? "bg-rose-500"
                      : p.position === "MID"
                      ? "bg-amber-400"
                      : p.position === "DEF"
                      ? "bg-blue-500"
                      : "bg-slate-500"
                  }`}
                ></div>
              </div>
            </button>
          );
        })}

        {/* Dynamic Ball Marker */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-slate-900 flex items-center justify-center shadow-lg transition-all duration-300 ease-out z-30"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
          }}
        >
          {/* Minimal soccer pattern lines */}
          <div className="w-full h-full rounded-full border border-dashed border-slate-950 bg-slate-100 flex items-center justify-center">
            <span className="text-[7px]">⚽</span>
          </div>
        </div>

        {/* Player dynamic tooltip box */}
        {hoveredPlayer && (
          <div
            className="absolute z-40 bg-slate-900/95 border border-slate-800 text-white rounded-lg p-2 shadow-2xl text-xs font-mono pointer-events-none -translate-y-full mb-4 w-40"
            style={{
              left: `calc(${hoveredPlayer.x}% - 80px)`,
              top: `${hoveredPlayer.y}%`,
            }}
          >
            <div className="font-bold truncate text-slate-200">
              {hoveredPlayer.name}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Team:</span>
              <span className={hoveredPlayer.team === "home" ? "text-slate-100" : "text-sky-300"}>
                {hoveredPlayer.team === "home" ? "Real Madrid" : "Man City"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
              <span>Position:</span>
              <span>{hoveredPlayer.position}</span>
            </div>
            <p className="text-[10px] text-emerald-400 text-center mt-1 pt-1 border-t border-slate-800">
              Click to view Heatmap & Stats
            </p>
          </div>
        )}
      </div>

      {/* Mini Pitch Legend */}
      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-slate-400 border-t border-slate-800/60 pt-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-400"></span>
            <span>Real Madrid</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-sky-300"></span>
            <span>Man City</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>Positional Role:</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>FWD</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>MID</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>DEF</span>
        </div>
      </div>
    </div>
  );
}
