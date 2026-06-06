import React from "react";
import { MatchState } from "../types.js";
import { ShieldAlert, Info, TrendingUp } from "lucide-react";

interface ScoreboardProps {
  matchState: MatchState;
}

export default function Scoreboard({ matchState }: ScoreboardProps) {
  const homePct = matchState.possession || 50;
  const awayPct = 100 - homePct;

  // Statistics blocks array
  const statsList = [
    { label: "Shots (On Target)", home: matchState.shotsHome, away: matchState.shotsAway },
    { label: "Goalkeeper Saves", home: matchState.savesHome, away: matchState.savesAway },
    { label: "Fouls Committed", home: matchState.foulsHome, away: matchState.foulsAway },
    { label: "Yellow Cards", home: matchState.yellowHome, away: matchState.yellowAway },
  ];

  return (
    <div id="scoreboard-stats-panel" className="bg-[#0c0c0e] border border-white/10 rounded-xl p-3.5 flex flex-col">
      <div className="flex items-center gap-2 mb-3.5">
        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left">
          MATCH PERFORMANCE SYSTEM
        </h3>
      </div>

      {/* Main Large Score Indicator */}
      <div className="bg-white/5 border border-white/5 rounded-lg p-3.5 flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <span className="text-xs font-mono text-slate-300 block uppercase tracking-wider font-bold">
            {matchState.homeTeam.name}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
            HOME SQUAD
          </span>
        </div>

        <div className="flex items-center gap-3 bg-[#0c0c0e] border border-white/10 px-4 py-2 rounded shadow-inner min-w-[100px] justify-center">
          <span className="text-xl font-bold font-mono text-white leading-none">
            {matchState.homeTeam.score}
          </span>
          <span className="text-slate-600 font-bold font-mono text-xs">:</span>
          <span className="text-xl font-bold font-mono text-white leading-none">
            {matchState.awayTeam.score}
          </span>
        </div>

        <div className="text-center flex-1">
          <span className="text-xs font-mono text-slate-300 block uppercase tracking-wider font-bold">
            {matchState.awayTeam.name}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
            AWAY SQUAD
          </span>
        </div>
      </div>

      {/* Real-time Possession meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between font-mono text-[10px] mb-1 text-slate-400">
          <span className="font-semibold text-slate-300">POSS {homePct}%</span>
          <span className="text-slate-500 text-[9px]">BALL RATIO</span>
          <span className="font-semibold text-indigo-400">POSS {awayPct}%</span>
        </div>
        <div className="w-full h-1.5 rounded overflow-hidden flex bg-white/5 border border-white/5">
          <div
            className="h-full bg-slate-300 transition-all duration-750 ease-out"
            style={{ width: `${homePct}%` }}
          ></div>
          <div
            className="h-full bg-indigo-500 transition-all duration-750 ease-out flex-1"
            style={{ width: `${awayPct}%` }}
          ></div>
        </div>
      </div>

      {/* Numerical Stats Bars */}
      <div className="flex flex-col gap-3">
        {statsList.map((stat, i) => {
          const totalVal = (stat.home + stat.away) || 1;
          const homeWidthPct = Math.round((stat.home / totalVal) * 100);
          const awayWidthPct = 100 - homeWidthPct;

          return (
            <div key={i} className="flex flex-col text-[10px]">
              <div className="flex items-center justify-between font-mono mb-0.5">
                <span className="font-bold text-slate-200">{stat.home}</span>
                <span className="text-[9px] uppercase text-slate-500 tracking-wider">
                  {stat.label}
                </span>
                <span className="font-bold text-indigo-400">{stat.away}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded overflow-hidden flex transition-all">
                <div
                  className="bg-slate-400 h-full transition-all duration-500"
                  style={{ width: `${homeWidthPct}%` }}
                ></div>
                <div
                  className="bg-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${awayWidthPct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live incidents banner list */}
      <div className="mt-4 pt-3.5 border-t border-white/5">
        <h4 className="text-[9px] font-bold font-mono tracking-widest text-slate-500 uppercase mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-slate-455" /> RECENT MATCH HIGHLIGHTS
        </h4>
        <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
          {matchState.events && matchState.events.length > 0 ? (
            matchState.events.slice(0, 5).map((evt) => (
              <div
                key={evt.id}
                className="bg-white/5 hover:bg-white/10 border border-white/5 px-2.5 py-1.5 rounded flex gap-2 items-start transition cursor-default group"
              >
                <span className="font-mono text-[9px] font-bold text-emerald-450 bg-emerald-500/10 px-1.5 py-0.2 rounded leading-none mt-0.5">
                  {evt.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-slate-350 leading-tight group-hover:text-slate-100">
                    {evt.description}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-black/40 border border-dashed border-white/5 rounded text-center justify-center font-mono text-[9px] text-slate-500">
              <Info className="w-3.5 h-3.5" /> No events logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
