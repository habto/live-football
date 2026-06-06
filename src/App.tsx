import React, { useState, useEffect, useRef } from "react";
import MatchHub from "./components/MatchHub.tsx";
import PitchMinimap from "./components/PitchMinimap.tsx";
import Scoreboard from "./components/Scoreboard.tsx";
import StreamCam from "./components/StreamCam.tsx";
import LiveChat from "./components/LiveChat.tsx";
import PlayerStats from "./components/PlayerStats.tsx";
import { MatchState, ChatMessage, UserPresence } from "./types.js";
import { Radio, ShieldAlert, Cpu, Award } from "lucide-react";

// Get customized user identity from localStorage or assign safe randoms
const LOCAL_STORAGE_KEY = "live_football_fan_identity_v2";

const defaultUserData = () => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("localStorage loading failed, fallback configured.");
    }
  }
  return {
    username: `Fan_${Math.floor(100 + Math.random() * 900)}`,
    supportTeam: "neutral" as "home" | "away" | "neutral",
    avatar: "⚽",
  };
};

export default function App() {
  const [selectedMatchId, setSelectedMatchId] = useState<string>("match-1");
  const [currentUser, setCurrentUser] = useState(defaultUserData());
  const [allMatches, setAllMatches] = useState<MatchState[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [presenceList, setPresenceList] = useState<UserPresence[]>([]);
  const [typingAuthor, setTypingAuthor] = useState<string | null>(null);
  const [activeFeed, setActiveFeed] = useState<"main" | "drone" | "net-left" | "booth">("main");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Sync user changes to localStorage
  const handleUpdateUser = (newUser: { username: string; supportTeam: "home" | "away" | "neutral"; avatar: string }) => {
    setCurrentUser(newUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error("Local storage sync failed:", e);
    }

    // Rejoin the room with the new user credentials immediately
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "join",
          matchId: selectedMatchId,
          ...newUser,
        })
      );
    }
  };

  // Quick initial HTTP load to populate match listings
  useEffect(() => {
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => {
        setAllMatches(data);
        const active = data.find((m: MatchState) => m.id === selectedMatchId);
        if (active) setActiveMatch(active);
      })
      .catch((err) => console.error("HTTP hydrated list loading failed:", err));
  }, [selectedMatchId]);

  // Connect & Sync WebSocket room communication
  useEffect(() => {
    // Clear any previous scheduled reconnects
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log(`Spinning WebSocket Hub connecting to: ${wsUrl}...`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket linked to live Match hub!");
        setIsConnected(true);
        // Dispatch instant room join credentials
        ws.send(
          JSON.stringify({
            type: "join",
            matchId: selectedMatchId,
            username: currentUser.username,
            supportTeam: currentUser.supportTeam,
            avatar: currentUser.avatar,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "room:sync") {
            setActiveMatch(payload.matchState);
            setChatHistory(payload.history);
          } else if (payload.type === "match:update") {
            if (payload.state.id === selectedMatchId) {
              setActiveMatch(payload.state);
              // Update listing matches inline as well
              setAllMatches((prev) =>
                prev.map((m) => (m.id === payload.state.id ? payload.state : m))
              );
            }
          } else if (payload.type === "chat:new") {
            if (payload.message.matchId === selectedMatchId) {
              setTypingAuthor(null); // clear typing state if reply arrives
              setChatHistory((prev) => {
                // Prevent duplicate inserts
                if (prev.some((m) => m.id === payload.message.id)) return prev;
                return [...prev, payload.message];
              });
            }
          } else if (payload.type === "chat:typing") {
            setTypingAuthor(payload.author);
            // Auto clear typing state after 4 seconds
            setTimeout(() => setTypingAuthor(null), 4000);
          } else if (payload.type === "room:presence") {
            setPresenceList(payload.presence);
          }
        } catch (e) {
          console.error("Failed to parse websocket message payload:", e);
        }
      };

      ws.onclose = () => {
        console.warn("WebSocket disconnected from match hub. Retrying in 4s...");
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket socket encounter failure:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [selectedMatchId]);

  // Fallback Polling interval service if WebSockets is ever resting
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!isConnected) {
        // Run light HTTP fetches to preserve interactive metrics
        fetch(`/api/matches/${selectedMatchId}`)
          .then((res) => res.json())
          .then((data) => {
            setActiveMatch(data);
          })
          .catch((e) => console.warn("Polling HTTP recovery failed:", e));
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isConnected, selectedMatchId]);

  // Dispatch WebSocket client comment submissions
  const handleSendMessage = (text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "chat:send",
          text,
        })
      );
    } else {
      // Offline fallback push if socket got severed
      const fallbackMsg: ChatMessage = {
        id: `offline-chat-${Date.now()}`,
        matchId: selectedMatchId,
        username: currentUser.username,
        text,
        timestamp: Date.now(),
        avatar: currentUser.avatar,
        supportTeam: currentUser.supportTeam,
      };
      setChatHistory((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setSelectedPlayerId(null); // clear active highlighted stats
    setChatHistory([]);
    setPresenceList([]);
  };

  return (
    <div id="live-sports-app" className="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Prime Header Navigation Hub */}
      <header className="bg-[#0c0c0e] border-b border-white/10 sticky top-0 z-50 h-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 px-2.5 py-1 rounded text-[10px] font-bold tracking-tighter uppercase animate-pulse">Live</div>
            <div className="flex flex-col leading-none font-mono">
              <span className="text-xs font-bold tracking-widest text-slate-100 uppercase">
                FANZONE LIVE
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">
                {activeMatch?.id === "match-1" ? "UEFA Champions League" : activeMatch?.id === "match-2" ? "La Liga" : "FIFA World Cup"}
              </span>
            </div>
          </div>

          {/* Center Info Banner */}
          {activeMatch && (
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-3 text-xs font-bold font-mono">
                <span className="text-right text-slate-300 uppercase tracking-wider text-[11px]">{activeMatch.homeTeam?.name}</span>
                <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded text-sm text-emerald-400">
                  {activeMatch.homeTeam?.score} - {activeMatch.awayTeam?.score}
                </span>
                <span className="text-left text-slate-300 uppercase tracking-wider text-[11px]">{activeMatch.awayTeam?.name}</span>
              </div>
              <div className="h-6 w-[1px] bg-white/10"></div>
              <div className="flex flex-col items-start leading-none font-mono">
                <span className="text-xs font-bold text-emerald-400">{activeMatch.minute}'</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">ELAPSED TIME</span>
              </div>
            </div>
          )}

          {/* Right Actionable Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md font-mono text-[10px] text-slate-450">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
              <span className="hidden sm:inline uppercase max-w-[120px] truncate">{currentUser.username} {currentUser.avatar}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center border border-white/20 shadow-inner">
              {currentUser.avatar || "⚽"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Workstation Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Match Selector Schedule & Dynamic Statistics Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <MatchHub
            allMatches={allMatches}
            selectedMatchId={selectedMatchId}
            onSelectMatch={handleSelectMatch}
          />
          {activeMatch && <Scoreboard matchState={activeMatch} />}
        </div>

        {/* CENTER COLUMN: Live Video Streams Simulation HUD & Tactical Coords radar */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {activeMatch && (
            <StreamCam
              matchState={activeMatch}
              activeFeed={activeFeed}
              onFeedChange={setActiveFeed}
            />
          )}

          {activeMatch && activeMatch.players && (
            <PitchMinimap
              players={activeMatch.players}
              ball={activeMatch.ball}
              homeTeamColor={activeMatch.homeTeam?.color || "from-white"}
              awayTeamColor={activeMatch.awayTeam?.color || "from-sky-300"}
              onSelectPlayer={(id) => setSelectedPlayerId(id)}
              selectedPlayerId={selectedPlayerId}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Fan Chatroom & Player Lineups Rating Roster Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <LiveChat
            chatHistory={chatHistory}
            presenceList={presenceList}
            typingAuthor={typingAuthor}
            onSendMessage={handleSendMessage}
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
          />

          {activeMatch && (
            <PlayerStats
              matchState={activeMatch}
              onSelectPlayerId={setSelectedPlayerId}
              selectedPlayerId={selectedPlayerId}
            />
          )}
        </div>
      </main>

      {/* Dashboard Human-literal footer */}
      <footer className="bg-[#0c0c0e] border-t border-white/10 p-3.5 font-mono text-[9px] text-slate-500 mt-auto leading-relaxed select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <span>
            © 2026 FanZone Live Sports Hub. Simulating matchday high fidelity tracking index.
          </span>
          <div className="flex gap-4">
            <span className="hover:text-slate-350 transition cursor-pointer">Security Codecs</span>
            <span className="hover:text-slate-350 transition cursor-pointer">Live Feeds policy</span>
            <span className="hover:text-slate-350 transition cursor-pointer">Gaffer AI credentials</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
