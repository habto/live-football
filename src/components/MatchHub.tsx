import React, { useState, useEffect } from "react";
import { MatchState } from "../types.js";
import { Calendar, Trophy, Play, CheckCircle } from "lucide-react";

interface MatchHubProps {
  allMatches: MatchState[];
  selectedMatchId: string;
  onSelectMatch: (id: string) => void;
}

export default function MatchHub({
  allMatches,
  selectedMatchId,
  onSelectMatch,
}: MatchHubProps) {
  // Simple state to run mock hours/minutes ticking counters for upcoming countdowns
  const [countdown, setCountdown] = useState({ hours: 1, minutes: 45, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) hours -= 1;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUnit = (num: number) => num.toString().padStart(2, "0");

  return (
    <div id="matchday-selection-hub" className="bg-[#0c0c0e] border border-white/10 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2.5">
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-left">
          SOCCER MATCHDAY HUB
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {allMatches.map((match) => {
          const isSelected = selectedMatchId === match.id;
          const isLive = match.status === "live";
          const isUpcoming = match.status === "upcoming";
          const isCompleted = match.status === "completed";

          return (
            <div
              key={match.id}
              onClick={() => onSelectMatch(match.id)}
              className={`border p-3 rounded-lg flex flex-col transition cursor-pointer text-left relative ${
                isSelected
                  ? "bg-white/10 border-indigo-500"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              {/* Badge upper stats */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-mono flex items-center gap-1">
                  {match.id === "match-1"
                    ? "UEFA Champions League"
                    : match.id === "match-2"
                    ? "La Liga Santander"
                    : "FIFA World Cup Finals"}
                </span>

                {isLive && (
                  <span className="bg-red-600/20 text-red-400 border border-red-500/30 font-mono text-[8px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                    LIVE
                  </span>
                )}
                {isUpcoming && (
                  <span className="bg-slate-800 text-slate-400 font-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                    UPCOMING
                  </span>
                )}
                {isCompleted && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 font-mono text-[8.5px] font-bold px-2 py-0.1 rounded flex items-center gap-1">
                    FINISHED
                  </span>
                )}
              </div>

              {/* Roster Match-up Row */}
              <div className="flex items-center justify-between font-mono gap-2 mb-1">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-100 block truncate">
                    {match.homeTeam.name || "Real Madrid"}
                  </span>
                </div>

                <div className="px-2 py-0.5 bg-black/60 border border-white/10 rounded text-center flex-shrink-0 min-w-[54px]">
                  {isLive && (
                    <span className="text-xs font-bold text-emerald-400">
                      {match.homeTeam.score} - {match.awayTeam.score}
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="text-[9px] font-bold text-slate-550">
                      VS
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-bold text-slate-350">
                      {match.homeTeam.score} - {match.awayTeam.score}
                    </span>
                  )}
                </div>

                <div className="flex-1 text-right">
                  <span className="text-xs font-bold text-slate-100 block truncate">
                    {match.awayTeam.name || "Manchester City"}
                  </span>
                </div>
              </div>

              {/* Action commentary highlights countdown footer */}
              {isUpcoming && (
                <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Starts in:</span>
                  <span className="text-amber-500 font-bold tracking-wider">
                    {formatUnit(countdown.hours)}h {formatUnit(countdown.minutes)}m {formatUnit(countdown.seconds)}s
                  </span>
                </div>
              )}
              {isLive && (
                <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Play className="w-3 h-3 text-emerald-500 animate-ping" /> Realtime Sync Active
                  </span>
                  <span className="font-bold text-slate-350">
                    {match.possession || 50}% Poss.
                  </span>
                </div>
              )}
              {isCompleted && match.id === "match-3" && (
                <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-slate-500">Penalties: 4 - 2</span>
                  <span className="text-amber-400 font-bold">Messi 🏆 Champion</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
