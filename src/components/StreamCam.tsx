import React, { useState, useEffect } from "react";
import { MatchState, PlayerCoord } from "../types.js";
import { Camera, RefreshCw, Radio, Maximize2, Volume2, Shield } from "lucide-react";

interface StreamCamProps {
  matchState: MatchState;
  activeFeed: "main" | "drone" | "net-left" | "booth";
  onFeedChange: (feed: "main" | "drone" | "net-left" | "booth") => void;
}

export default function StreamCam({
  matchState,
  activeFeed,
  onFeedChange,
}: StreamCamProps) {
  const [glitch, setGlitch] = useState(false);
  const [commentaryLine, setCommentaryLine] = useState("Broadcasting live from Estadio Santiago Bernabéu...");

  // Sync commentary lines based on recent events or ball movements
  useEffect(() => {
    if (matchState.events && matchState.events.length > 0) {
      setCommentaryLine(matchState.events[0].description);
    }
  }, [matchState.events]);

  // Simulate video feed glitters
  useEffect(() => {
    const timer = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const ball = matchState.ball || { x: 50, y: 50 };
  const players = matchState.players || [];

  return (
    <div id="interactive-screambox" className="bg-[#0c0c0e] border border-white/10 rounded-xl overflow-hidden relative flex flex-col">
      {/* Stream Camera Header Bar */}
      <div className="bg-black/40 px-3.5 py-2.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span className="font-mono text-[10px] font-bold leading-none uppercase tracking-widest text-slate-200">
            LIVE BROADCAST FEED
          </span>
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded leading-none uppercase">
            1085p
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-200" />
          <Maximize2 className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-200" />
        </div>
      </div>

      {/* Video Stream Stage */}
      <div className="relative w-full aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Subtle camera film grain / Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.6)_100%)] z-10"></div>
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-10 z-10"></div>

        {/* Glitch Overlay */}
        {glitch && (
          <div className="absolute inset-0 bg-sky-500/10 mix-blend-color-dodge pointer-events-none z-10 animate-pulse"></div>
        )}

        {/* Dynamic Interactive Render according to FEED type */}
        {activeFeed === "booth" ? (
          /* CLYDE'S BOOTH STREAM view */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950">
            <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-950/20">
              <div className="absolute inset-0.5 rounded-full border border-emerald-900 animate-ping opacity-35"></div>
              <Radio className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-center max-w-sm px-4">
              <h4 className="text-sm font-semibold tracking-wide text-emerald-400 font-mono">
                CLYDE'S COMMENTARY LOGS
              </h4>
              <p className="text-slate-400 text-xs font-mono mt-1 pt-1 border-t border-slate-900 italic leading-relaxed">
                "{commentaryLine || "Monitoring team shapes and match momentum closely..."}"
              </p>
            </div>
            <div className="absolute bottom-4 flex gap-1.5 items-center bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>BOOTH MIC ACTIVE | AUDIO FEED 1</span>
            </div>
          </div>
        ) : (
          /* PITCH SIMULATED ANIMATED TRACKING VIEW (Main, Drone, Net-Left) */
          <div
            className="absolute inset-0 transition-all duration-700 ease-out"
            style={{
              transform:
                activeFeed === "net-left"
                  ? "scale(2.2) translate(18%, 0%)" // zoomed into leftmost goal
                  : activeFeed === "drone"
                  ? "scale(0.85) translate(0, 0)" // drone overview
                  : `scale(1.5) translate(${-(ball.x - 50) * 0.4}%, ${-(ball.y - 50) * 0.3}%)`, // Default Main Cam following Ball
            }}
          >
            {/* Vector pitch backdrop */}
            <div className="w-[180%] h-[180%] -translate-x-[22%] -translate-y-[22%] relative bg-emerald-900">
              {/* grass strips */}
              <div className="absolute inset-0 flex flex-col opacity-60">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 w-full ${
                      idx % 2 === 0 ? "bg-[#166534]" : "bg-[#14532d]"
                    }`}
                  ></div>
                ))}
              </div>

              {/* Pitch white lines */}
              <div className="absolute inset-[10%] border-2 border-white/30 flex items-center justify-center">
                <div className="w-0.5 h-full bg-white/30 absolute left-1/2"></div>
                <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center"></div>
                
                {/* Penalty goal areas */}
                <div className="absolute left-0 top-1/4 bottom-1/4 w-20 border-2 border-white/30 border-l-0"></div>
                <div className="absolute right-0 top-1/4 bottom-1/4 w-20 border-2 border-white/30 border-r-0"></div>
              </div>

              {/* Simulated Players on Field */}
              {players.map((plr) => {
                const isHome = plr.team === "home";
                return (
                  <div
                    key={`stream-p-${plr.id}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-1000 ease-out`}
                    style={{
                      left: `${plr.x}%`,
                      top: `${plr.y}%`,
                    }}
                  >
                    {/* Character Circle */}
                    <div
                      className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center font-bold text-[8px] shadow-md ${
                        isHome
                          ? "bg-white border-gray-300 text-slate-900"
                          : "bg-sky-400 border-sky-300 text-slate-800"
                      }`}
                    >
                      {plr.number}
                    </div>
                    {/* Name subtitle */}
                    <span className="text-[6px] font-sans text-white bg-slate-950/70 border border-slate-900 px-0.5 py-0.2 rounded mt-0.5 whitespace-nowrap scale-80 font-mono">
                      {plr.name.split(" ").pop()}
                    </span>
                  </div>
                );
              })}

              {/* Dynamic Tracking Soccer Ball */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-950 flex items-center justify-center shadow-lg transition-all duration-300 ease-out z-20"
                style={{
                  left: `${ball.x}%`,
                  top: `${ball.y}%`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-slate-100 rounded-full border border-slate-950 flex items-center justify-center animate-spin">
                  ⚽
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live HUD Information Overlay */}
        <div className="absolute top-4 left-4 z-20 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-3 shadow-xl">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono tracking-wider font-bold text-slate-400">
              MADRID (H) VS MAN CITY
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-bold font-mono text-white">
                {matchState.homeTeam.score} - {matchState.awayTeam.score}
              </span>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 animate-pulse bg-emerald-950/50 border border-emerald-900 px-1.5 py-0.1 rounded">
                {matchState.minute}'
              </span>
            </div>
          </div>
        </div>

        {/* Camera angle display text */}
        <div className="absolute top-4 right-4 z-20 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-2 shadow-md">
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-[9px] font-semibold text-slate-300 capitalize">
            CAM: {activeFeed === "net-left" ? "Behind Goal-A" : activeFeed === "booth" ? "Clyde Booth" : `${activeFeed} feed`}
          </span>
        </div>

        {/* Subtitle scrolling ticker comment box */}
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/85 border border-slate-800 p-2.5 rounded-xl backdrop-blur-md flex items-start gap-2.5 shadow-2xl">
          <div className="bg-rose-950 text-rose-400 border border-rose-900 text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded leading-none mt-1 flex-shrink-0 font-mono">
            CC LIVE
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-slate-200 truncate leading-tight">
              {commentaryLine || "Tactical systems analyzing formations... Gaffer AI commenting box synced."}
            </p>
          </div>
        </div>
      </div>

      {/* Camera angle switcher footer */}
      <div className="bg-black/40 px-3 py-2 flex flex-wrap items-center justify-between border-t border-white/10 gap-2">
        <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
          <Camera className="w-3 h-3 text-slate-400" /> Choose Camera Angle:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "main", label: "Main Feed" },
            { id: "drone", label: "Tac Drone" },
            { id: "net-left", label: "Goal Cam" },
            { id: "booth", label: "Clyde Booth" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onFeedChange(item.id as any)}
              className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold tracking-tight border cursor-pointer transition-all ${
                activeFeed === item.id
                  ? "bg-white/15 border-white/15 text-white"
                  : "bg-white/5 border-transparent text-slate-450 hover:bg-white/10 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
