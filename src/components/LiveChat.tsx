import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, UserPresence } from "../types.js";
import { Send, Settings, User, Radio, Users, ThumbsUp, Tag } from "lucide-react";

interface LiveChatProps {
  chatHistory: ChatMessage[];
  presenceList: UserPresence[];
  typingAuthor: string | null;
  onSendMessage: (text: string) => void;
  currentUser: { username: string; supportTeam: "home" | "away" | "neutral"; avatar: string };
  onUpdateUser: (newUser: { username: string; supportTeam: "home" | "away" | "neutral"; avatar: string }) => void;
}

const AVATAR_OPTIONS = ["⚽", "🧠", "👑", "🪄", "⭐", "🐓", "📣", "🍻", "🔥", "⚽", "🕶️", "🙌"];

export default function LiveChat({
  chatHistory,
  presenceList,
  typingAuthor,
  onSendMessage,
  currentUser,
  onUpdateUser,
}: LiveChatProps) {
  const [inputText, setInputText] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [usernameInput, setUsernameInput] = useState(currentUser.username);
  const [supportTeamInput, setSupportTeamInput] = useState(currentUser.supportTeam);
  const [avatarInput, setAvatarInput] = useState(currentUser.avatar);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatHistory, typingAuthor]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleApplyUserConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      username: usernameInput.trim() || `Fan_${Math.floor(Math.random() * 1000)}`,
      supportTeam: supportTeamInput,
      avatar: avatarInput,
    });
    setShowConfig(false);
  };

  const sendQuickCheer = (cheerText: string) => {
    onSendMessage(cheerText);
  };

  return (
    <div id="live-chat-panel" className="bg-[#0c0c0e] border border-white/10 rounded-xl flex flex-col h-[485px] overflow-hidden">
      {/* Chat Room Header */}
      <div className="bg-black/40 px-3.5 py-2.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <h3 className="text-[11px] font-bold tracking-widest text-slate-500 font-mono uppercase">
            FAN ZONE CHAT
          </h3>
          <span className="bg-white/5 text-slate-400 font-mono text-[9px] px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
            <Users className="w-2.5 h-2.5 text-slate-500" />
            {presenceList.length} Online
          </span>
        </div>
        <button
          onClick={() => {
            setUsernameInput(currentUser.username);
            setSupportTeamInput(currentUser.supportTeam);
            setAvatarInput(currentUser.avatar);
            setShowConfig(!showConfig);
          }}
          className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/5 transition cursor-pointer"
          title="Profile Setup"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {showConfig ? (
        /* USER PROFILE EDIT CONFIG FORM */
        <form onSubmit={handleApplyUserConfig} className="flex-1 p-5 bg-slate-950 flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold font-mono text-sky-400 uppercase tracking-widest border-b border-slate-800 pb-2">
              CONFIGURE FAN PROFILE
            </h4>

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                FAN NICKNAME:
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                maxLength={18}
                className="bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-400"
                placeholder="Enter nickname..."
              />
            </div>

            {/* Support Group Row */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                SUPPORT GROUP:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "home", label: "Real Madrid" },
                  { id: "away", label: "Man City" },
                  { id: "neutral", label: "Neutral" },
                ].map((grp) => (
                  <button
                    type="button"
                    key={grp.id}
                    onClick={() => setSupportTeamInput(grp.id as any)}
                    className={`px-2 py-2 rounded-xl border font-mono text-[10px] font-bold cursor-pointer transition-all ${
                      supportTeamInput === grp.id
                        ? "bg-sky-400/10 border-sky-400 text-sky-400"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Selectors */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                SELECT FAN ICON:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((ico, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAvatarInput(ico)}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm cursor-pointer transition-all ${
                      avatarInput === ico
                        ? "bg-slate-200 border-white text-slate-950 scale-110"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200"
                    }`}
                  >
                    {ico}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-xl text-xs font-mono cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer transition"
            >
              Save Profile
            </button>
          </div>
        </form>
      ) : (
        /* CHATROOM DISCUSSIONS SCREEN */
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-black/20">
          {/* Scrollable messages log */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-2.5"
          >
            {chatHistory.map((msg) => {
              const isMe = msg.username === currentUser.username && !msg.isAi;
              let supportTagColor = "text-slate-400 border-white/5 bg-white/5";
              if (msg.supportTeam === "home") {
                supportTagColor = "text-slate-100 border-white/10 bg-white/10";
              } else if (msg.supportTeam === "away") {
                supportTagColor = "text-indigo-400 border-indigo-500/10 bg-indigo-500/10";
              }

              return (
                <div
                  key={msg.id}
                  className={`flex gap-1.5 text-left group ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* User Profile Avatar Icon */}
                  <div className="w-7 h-7 rounded bg-white/5 border border-white/5 flex items-center justify-center text-xs flex-shrink-0 select-none font-mono">
                    {msg.avatar || "⚽"}
                  </div>

                  {/* Body Speech Bubble */}
                  <div className={`flex flex-col max-w-[82%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[9px] font-bold text-slate-300">
                        {msg.username}
                      </span>
                      {msg.isAi && (
                        <span className="bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 font-mono text-[8px] font-bold px-1.5 py-0.2 rounded uppercase leading-none">
                          COCOMMENTATOR
                        </span>
                      )}
                      {!msg.isAi && msg.supportTeam && (
                        <span className={`font-mono text-[8.5px] px-1 py-0.1 border rounded uppercase scale-90 ${supportTagColor}`}>
                          {msg.supportTeam === "home" ? "RM" : msg.supportTeam === "away" ? "MCI" : "Neutral"}
                        </span>
                      )}
                    </div>

                    <div
                      className={`px-2.5 py-1.5 rounded text-[11px] leading-tight font-sans ${
                        msg.isAi
                          ? "bg-white/5 border border-emerald-500/20 text-emerald-100 rounded-tl-none font-mono"
                          : isMe
                          ? "bg-white text-slate-900 rounded-tr-none font-medium"
                          : "bg-white/5 text-slate-100 border border-white/5 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dynamic Clyde Typing Indicator */}
            {typingAuthor && (
              <div className="flex gap-1.5 items-center text-left">
                <div className="w-7 h-7 rounded bg-[#0c0c0e] border border-white/5 flex items-center justify-center text-xs">
                  🎙️
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[8px] text-slate-500 font-semibold uppercase tracking-wider">
                    {typingAuthor} is drafting commentary...
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 bg-white/5 px-2.5 py-1.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce"></span>
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce delay-100"></span>
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick interactive Cheer toolbar */}
          <div className="px-2 py-1.5 bg-black/45 border-t border-white/5 flex gap-1.5 items-center overflow-x-auto select-none">
            <span className="font-mono text-[8px] font-bold text-slate-500 tracking-wider flex-shrink-0 flex items-center gap-1 uppercase">
              <Tag className="w-2 h-2" /> SUGGESTED:
            </span>
            {[
              { text: "🩵 COME ON CITY!" },
              { text: "🤍 HALA MADRID!" },
              { text: "🔥 What an absolute goal!" },
              { text: "📕 Ref, yellow card surely!" },
              { text: "@Clyde AI, give me a tactical status report!" }
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendQuickCheer(btn.text)}
                className="bg-white/5 border border-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-[8.5px] font-mono text-slate-400 hover:text-white transition whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                {btn.text.length > 20 ? "Ask Clyde AI" : btn.text}
              </button>
            ))}
          </div>

          {/* Chat Message Input form */}
          <form
            onSubmit={handleSend}
            className="p-2 bg-[#0c0c0e] border-t border-white/5 flex gap-1.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tag '@clyde' to consult the AI commentator..."
              className="flex-1 bg-white/5 border border-white/5 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-white/15 font-mono"
            />
            <button
              type="submit"
              className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-3.5 py-1 rounded flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 font-bold" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
