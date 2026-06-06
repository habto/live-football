import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { MatchState, Player, MatchEvent, ChatMessage, PlayerCoord } from "./src/types.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Initialize server-side Gemini API key securely
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiInstance;
}

// Global Chat Messages Cache (Memory)
const chatMessages: Record<string, ChatMessage[]> = {
  "match-1": [
    { id: "init-1", matchId: "match-1", username: "TacticalGuru", text: "Main tactical battles are always decided in midfield. Can City contain Kroos?", timestamp: Date.now() - 500000, avatar: "🧠", supportTeam: "away" },
    { id: "init-2", matchId: "match-1", username: "RMCF_Galactico", text: "Vini Jr. has the speed to burn Walker down our left flank. Hala Madrid!", timestamp: Date.now() - 400000, avatar: "👑", supportTeam: "home" },
    { id: "init-Clyde-1", matchId: "match-1", username: "Clyde AI 📻", text: "Welcome to the commentary box, football fanatics! I'm Clyde, your tactical analyst and play-by-play moderator. Tag me with '@Clyde' or fire questions to analyze tactics, match statistics, or player ratings!", timestamp: Date.now() - 350000, avatar: "🎙️", isAi: true }
  ],
  "match-2": [
    { id: "init-3", matchId: "match-2", username: "BlaugranaKid", text: "El Clásico on the horizon. Pedri is match-ready, predictions?", timestamp: Date.now() - 200000, avatar: "🪄", supportTeam: "home" }
  ],
  "match-3": [
    { id: "init-4", matchId: "match-3", username: "Albiceleste_🏆", text: "Still dreaming of that December night in Lusail. Greatest match in history!", timestamp: Date.now() - 600000, avatar: "⭐", supportTeam: "home" },
    { id: "init-5", matchId: "match-3", username: "LesBleus98", text: "Mbappe's hat-trick was pure alien behavior. What a heroic fightback.", timestamp: Date.now() - 500000, avatar: "🐓", supportTeam: "away" }
  ]
};

// Seeding standard team schedules
const defaultRealMadridRoster: Player[] = [
  { id: "rm-1", name: "Thibaut Courtois", number: 1, position: "GK", rating: 8.1, stats: { goals: 0, assists: 0, shots: 0, passes: 14, passAccuracy: 85, tackles: 0, distanceRan: 3.2 } },
  { id: "rm-2", name: "Dani Carvajal", number: 2, position: "DEF", rating: 7.2, stats: { goals: 0, assists: 0, shots: 1, passes: 41, passAccuracy: 88, tackles: 3, distanceRan: 7.4 } },
  { id: "rm-3", name: "Antonio Rüdiger", number: 22, position: "DEF", rating: 7.8, stats: { goals: 0, assists: 0, shots: 0, passes: 48, passAccuracy: 92, tackles: 4, distanceRan: 7.1 } },
  { id: "rm-4", name: "Éder Militão", number: 3, position: "DEF", rating: 7.0, stats: { goals: 0, assists: 0, shots: 0, passes: 39, passAccuracy: 90, tackles: 2, distanceRan: 6.9 } },
  { id: "rm-5", name: "Ferland Mendy", number: 23, position: "DEF", rating: 6.9, stats: { goals: 0, assists: 0, shots: 0, passes: 32, passAccuracy: 82, tackles: 2, distanceRan: 7.2 } },
  { id: "rm-6", name: "Federico Valverde", number: 15, position: "MID", rating: 7.5, stats: { goals: 0, assists: 1, shots: 2, passes: 53, passAccuracy: 89, tackles: 1, distanceRan: 8.6 } },
  { id: "rm-7", name: "Toni Kroos", number: 8, position: "MID", rating: 8.4, stats: { goals: 0, assists: 1, shots: 0, passes: 72, passAccuracy: 96, tackles: 1, distanceRan: 7.9 } },
  { id: "rm-8", name: "Jude Bellingham", number: 5, position: "MID", rating: 8.6, stats: { goals: 1, assists: 0, shots: 3, passes: 46, passAccuracy: 91, tackles: 2, distanceRan: 8.4 } },
  { id: "rm-9", name: "Rodrygo Silva", number: 11, position: "FWD", rating: 7.3, stats: { goals: 0, assists: 0, shots: 2, passes: 28, passAccuracy: 84, tackles: 0, distanceRan: 7.3 } },
  { id: "rm-10", name: "Vinícius Júnior", number: 7, position: "FWD", rating: 8.9, stats: { goals: 1, assists: 1, shots: 4, passes: 22, passAccuracy: 80, tackles: 1, distanceRan: 7.8 } },
  { id: "rm-11", name: "Eduardo Camavinga", number: 12, position: "MID", rating: 7.1, stats: { goals: 0, assists: 0, shots: 1, passes: 35, passAccuracy: 88, tackles: 3, distanceRan: 8.1 } }
];

const defaultManCityRoster: Player[] = [
  { id: "mc-1", name: "Ederson Moraes", number: 31, position: "GK", rating: 7.0, stats: { goals: 0, assists: 0, shots: 0, passes: 28, passAccuracy: 91, tackles: 0, distanceRan: 3.5 } },
  { id: "mc-2", name: "Kyle Walker", number: 2, position: "DEF", rating: 7.4, stats: { goals: 0, assists: 0, shots: 0, passes: 51, passAccuracy: 89, tackles: 2, distanceRan: 7.9 } },
  { id: "mc-3", name: "Rúben Dias", number: 3, position: "DEF", rating: 7.5, stats: { goals: 0, assists: 0, shots: 0, passes: 65, passAccuracy: 94, tackles: 3, distanceRan: 7.0 } },
  { id: "mc-4", name: "Joško Gvardiol", number: 24, position: "DEF", rating: 7.3, stats: { goals: 0, assists: 0, shots: 1, passes: 54, passAccuracy: 87, tackles: 1, distanceRan: 7.6 } },
  { id: "mc-5", name: "Manuel Akanji", number: 25, position: "DEF", rating: 7.1, stats: { goals: 0, assists: 0, shots: 0, passes: 48, passAccuracy: 91, tackles: 2, distanceRan: 7.2 } },
  { id: "mc-6", name: "Rodrigo Hernandez", number: 16, position: "MID", rating: 8.5, stats: { goals: 0, assists: 0, shots: 2, passes: 81, passAccuracy: 95, tackles: 4, distanceRan: 8.9 } },
  { id: "mc-7", name: "Kevin De Bruyne", number: 17, position: "MID", rating: 8.8, stats: { goals: 1, assists: 1, shots: 4, passes: 58, passAccuracy: 90, tackles: 1, distanceRan: 8.2 } },
  { id: "mc-8", name: "Bernardo Silva", number: 20, position: "MID", rating: 7.7, stats: { goals: 0, assists: 0, shots: 1, passes: 62, passAccuracy: 92, tackles: 2, distanceRan: 9.1 } },
  { id: "mc-9", name: "Phil Foden", number: 47, position: "MID", rating: 8.3, stats: { goals: 1, assists: 0, shots: 3, passes: 44, passAccuracy: 88, tackles: 1, distanceRan: 8.3 } },
  { id: "mc-10", name: "Erling Haaland", number: 9, position: "FWD", rating: 7.9, stats: { goals: 0, assists: 0, shots: 5, passes: 12, passAccuracy: 75, tackles: 0, distanceRan: 7.1 } },
  { id: "mc-11", name: "Jack Grealish", number: 10, position: "FWD", rating: 7.4, stats: { goals: 0, assists: 1, shots: 1, passes: 38, passAccuracy: 89, tackles: 1, distanceRan: 7.7 } }
];

// Initialize global matches database
const matches: Record<string, MatchState> = {
  "match-1": {
    id: "match-1",
    status: "live",
    minute: 60,
    possession: 47,
    shotsHome: 12,
    shotsAway: 14,
    foulsHome: 8,
    foulsAway: 9,
    savesHome: 5,
    savesAway: 4,
    yellowHome: 1,
    yellowAway: 2,
    homeTeam: { name: "Real Madrid", short: "RMA", color: "from-white to-gray-200 border-gray-300 text-gray-800", score: 2, roster: JSON.parse(JSON.stringify(defaultRealMadridRoster)) },
    awayTeam: { name: "Manchester City", short: "MCI", color: "from-sky-300 to-sky-500 border-sky-400 text-white", score: 2, roster: JSON.parse(JSON.stringify(defaultManCityRoster)) },
    events: [
      { id: "e-1", time: "18'", type: "GOAL", player: "Vinícius Júnior", team: "home", description: "GOAAAAAL! Vinícius Jr. scores! Sensational run cut inside Walker and curler into Ederson's bottom corner!" },
      { id: "e-2", time: "32'", type: "CARD_YELLOW", player: "Dani Carvajal", team: "home", description: "Yellow Card: Carvajal brings down Grealish with a tactical shirt pull during a break." },
      { id: "e-3", time: "41'", type: "GOAL", player: "Phil Foden", team: "away", description: "TREMENDOUS EQUALIZER! Foden latches onto De Bruyne's dummy and launches an absolute missile from 25 yards!" },
      { id: "e-4", time: "52'", type: "GOAL", player: "Kevin De Bruyne", team: "away", description: "CITY IN THE LEAD! De Bruyne executes a pinpoint freekick, hooking around Thibaut's sprawling reach." },
      { id: "e-5", time: "58'", type: "GOAL", player: "Jude Bellingham", team: "home", description: "EQUALIZER AGAIN! Bellingham header! Met Kroos' superb sweeping corner and hammered home!" }
    ],
    ball: { x: 50, y: 50 },
    players: []
  },
  "match-2": {
    id: "match-2",
    status: "upcoming",
    minute: 0,
    possession: 50,
    shotsHome: 0,
    shotsAway: 0,
    foulsHome: 0,
    foulsAway: 0,
    savesHome: 0,
    savesAway: 0,
    yellowHome: 0,
    yellowAway: 0,
    homeTeam: { name: "Barcelona", short: "BAR", color: "from-blue-600 to-red-600 border-blue-700 text-white", score: 0, roster: [] },
    awayTeam: { name: "Real Madrid", short: "RMA", color: "from-white to-slate-200 border-gray-300 text-gray-800", score: 0, roster: [] },
    events: [],
    ball: { x: 50, y: 50 },
    players: []
  },
  "match-3": {
    id: "match-3",
    status: "completed",
    minute: 90,
    possession: 54,
    shotsHome: 20,
    shotsAway: 18,
    foulsHome: 12,
    foulsAway: 15,
    savesHome: 6,
    savesAway: 7,
    yellowHome: 4,
    yellowAway: 3,
    homeTeam: { name: "Argentina", short: "ARG", color: "from-sky-300 to-white border-sky-200 text-sky-800", score: 3, roster: [] },
    awayTeam: { name: "France", short: "FRA", color: "from-blue-800 to-blue-900 border-blue-900 text-white", score: 3, roster: [] },
    events: [
      { id: "h-1", time: "23'", type: "GOAL", player: "Lionel Messi", team: "home", description: "GOAL! Lionel Messi converts the penalty with ice-cold confidence, sending Lloris the wrong way." },
      { id: "h-2", time: "36'", type: "GOAL", player: "Angel Di Maria", team: "home", description: "WORLD-CLASS TEAM GOAL! Mac Allister slips it across the face of goal, and Di Maria finishes with exquisite class!" },
      { id: "h-3", time: "80'", type: "GOAL", player: "Kylian Mbappé", team: "away", description: "GOAL! Mbappe hammers home from the spot to breathe life back into the French squad!" },
      { id: "h-4", time: "81'", type: "GOAL", player: "Kylian Mbappé", team: "away", description: "UNBELIEVABLE EQUALIZER! Mbappe volley! Absolute shockwaves in Lusail, 2-2 in a flash!" },
      { id: "h-5", time: "108'", type: "GOAL", player: "Lionel Messi", team: "home", description: "GOAL! Messi scrambles it over the line in extra-time! Argentina fans are weeping!" },
      { id: "h-6", time: "118'", type: "GOAL", player: "Kylian Mbappé", team: "away", description: "HAT-TRICK! MBAPPE PENALTY! 3-3! What on earth are we witnessing?!" },
      { id: "h-7", time: "PEN", type: "INFO", description: "Argentina wins 4-2 on Penalties! Lionel Messi lifts the FIFA World Cup trophy!" }
    ],
    ball: { x: 50, y: 50 },
    players: []
  }
};

// Tactical formation baseline coordinate mappings
// X: 0..100 (GK at 5, forwards at 85)
// Y: 0..100 (Spread from 10 to 90)
const homeBaseCoords: Record<string, { x: number; y: number; role: "GK" | "DEF" | "MID" | "FWD" }> = {
  "rm-1": { x: 8, y: 50, role: "GK" },
  "rm-2": { x: 30, y: 85, role: "DEF" },
  "rm-3": { x: 25, y: 60, role: "DEF" },
  "rm-4": { x: 25, y: 40, role: "DEF" },
  "rm-5": { x: 30, y: 15, role: "DEF" },
  "rm-11": { x: 42, y: 30, role: "MID" },
  "rm-7": { x: 40, y: 50, role: "MID" },
  "rm-6": { x: 45, y: 70, role: "MID" },
  "rm-8": { x: 58, y: 50, role: "MID" },
  "rm-9": { x: 72, y: 75, role: "FWD" },
  "rm-10": { x: 75, y: 25, role: "FWD" }
};

const awayBaseCoords: Record<string, { x: number; y: number; role: "GK" | "DEF" | "MID" | "FWD" }> = {
  "mc-1": { x: 92, y: 50, role: "GK" },
  "mc-5": { x: 70, y: 15, role: "DEF" },
  "mc-3": { x: 75, y: 38, role: "DEF" },
  "mc-4": { x: 75, y: 62, role: "DEF" },
  "mc-2": { x: 70, y: 85, role: "DEF" },
  "mc-6": { x: 58, y: 35, role: "MID" },
  "mc-8": { x: 58, y: 65, role: "MID" },
  "mc-11": { x: 48, y: 18, role: "MID" },
  "mc-7": { x: 46, y: 50, role: "MID" },
  "mc-9": { x: 48, y: 82, role: "MID" },
  "mc-10": { x: 28, y: 50, role: "FWD" }
};

// Local simulation state variables
let ballOwnerId = "rm-7"; // Kroos begins with the ball
let simBallX = 40;
let simBallY = 50;
let targetBallX = 40;
let targetBallY = 50;
let transitionProgress = 1;
let lastSimActionTime = 0;
let possessionTicks = { home: 47, away: 53 };

// Helpers to calculate AI Reactions secure from server bounds
async function triggerClydeAutoCommentary(eventDescription: string) {
  const comment = await generateAiCommentary(eventDescription);
  const newMessage: ChatMessage = {
    id: `clyde-auto-${Math.floor(Math.random() * 100000)}`,
    matchId: "match-1",
    username: "Clyde AI 📻",
    text: comment,
    timestamp: Date.now(),
    avatar: "🎙️",
    isAi: true
  };
  chatMessages["match-1"].push(newMessage);
  broadcastToRoom("match-1", { type: "chat:new", message: newMessage });
}

let geminiCooldownUntil = 0;

function isOnCooldown(): boolean {
  return Date.now() < geminiCooldownUntil;
}

function triggerGeminiCooldown(err: any) {
  const errMsg = err && typeof err === 'object' ? JSON.stringify(err) : String(err);
  let cooldownDuration = 60000; // 1 minute default

  if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
    cooldownDuration = 10 * 60 * 1000; // 10 minutes for quota limits
    console.log("[Gemini] Quota hit. Activating a 10-minute cooldown mechanism to prevent spamming the API.");
  } else if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
    cooldownDuration = 2 * 60 * 1000; // 2 minutes for temporary busy servers (503)
    console.log("[Gemini] Server is busy (503). Activating a 2-minute cooldown.");
  } else {
    cooldownDuration = 1 * 60 * 1000; // 1 minute general cooldown
    console.log("[Gemini] API error received. Activating a 1-minute cooldown.");
  }
  
  geminiCooldownUntil = Date.now() + cooldownDuration;
}

// Generate Clyde Commentary (Gemini server call with graceful placeholder offline logic)
async function generateAiCommentary(eventDescription: string): Promise<string> {
  const offlineComments = [
    `Unbelievable scene on the pitch! ${eventDescription}. A display of majestic football intelligence!`,
    `Gaffer is shouting from the touchlines! ${eventDescription}. Remarkable tactical reading!`,
    `The crowd is absolutely on their feet! ${eventDescription}. What an absolute firecracker of a match!`,
    `Pure football heritage right before our eyes! ${eventDescription}. Absolutely world-class!`,
    `Talk about magic! ${eventDescription}. What a masterclass of technique and composure!`,
    `An absolute beauty of a play! ${eventDescription}. The tactics boards are being rewritten as we speak!`,
    `Stunning sequence! ${eventDescription}. That is what we pay our hard-earned money to witness!`
  ];

  if (isOnCooldown()) {
    return offlineComments[Math.floor(Math.random() * offlineComments.length)];
  }

  const ai = getGemini();
  if (!ai) {
    return offlineComments[Math.floor(Math.random() * offlineComments.length)];
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are Clyde AI, a legendary, passionate, and witty British football commentator.
      Comment on this direct live incident that just occurred in the Real Madrid vs Man City match: "${eventDescription}".
      Requirements:
      - 1 to 2 sentences max.
      - Sound incredibly professional, expressive, energetic, and tactical.
      - Absolutely DO NOT use hashtags, emojis, or dry corporate language.`
    });
    return response.text?.trim() || "What an outstanding performance from both teams!";
  } catch (err) {
    triggerGeminiCooldown(err);
    console.warn("[Gemini Fallback] Standard commentary triggered during temporary API unavailability:", err instanceof Error ? err.message : String(err));
    return offlineComments[Math.floor(Math.random() * offlineComments.length)];
  }
}

// Answer fan chat queries securely on the server
async function answerFanQuery(userMessage: string, supportTeam: string): Promise<string> {
  const currentMatch = matches["match-1"];
  const simpleSummary = `Real Madrid ${currentMatch.homeTeam.score} - ${currentMatch.awayTeam.score} Manchester City. Minute: ${currentMatch.minute}. Shots: RMA ${currentMatch.shotsHome}, MCI ${currentMatch.shotsAway}. Possession: Real Madrid ${currentMatch.possession}%, Man City ${100 - currentMatch.possession}%.`;
  
  const offlineAnswers = [
    `Clyde here! My high-intelligence tactical mainframe is momentarily resting on the bench, but looking at our live stats (${simpleSummary}), both gaffers are in for an incredibly tight finish! Keep supporting your team with pride!`,
    `Cracking question! While I'm consulting my notebook on the sideline, looking at the board (${simpleSummary}), you've got to say it's anyone's game. True tactical masterclass!`,
    `Fascinating perspective from the stands! Looking at the dynamic display (${simpleSummary}), the drama in midfield is keeping us all on the edge of our seats! Let's see if the tacticians can break this deadlock!`
  ];

  if (isOnCooldown()) {
    return offlineAnswers[Math.floor(Math.random() * offlineAnswers.length)];
  }

  const ai = getGemini();
  if (!ai) {
    return offlineAnswers[Math.floor(Math.random() * offlineAnswers.length)];
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are Clyde AI, the legendary British football commentator.
      A fan support team designated as "${supportTeam || "neutral"}" asked you in the match chat: "${userMessage}".
      The active match situation: Real Madrid vs Manchester City. Score is RMA ${currentMatch.homeTeam.score} - ${currentMatch.awayTeam.score} MCI, Minute: ${currentMatch.minute}.
      Tactical stats outline: RMA has ${currentMatch.shotsHome} shots, MCI has ${currentMatch.shotsAway} shots. 
      Formulate a smart, witty, and deeply informed sports banter response (1 to 3 sentences max). Use football idioms, praise or gently banter their player ratings, and keep user experience energetic. Strictly no hashtags.`
    });
    return response.text?.trim() || "Spot-on point! This midfield contest is indeed a chess match!";
  } catch (err) {
    triggerGeminiCooldown(err);
    console.warn("[Gemini Fallback] Fan query handled offline:", err instanceof Error ? err.message : String(err));
    return offlineAnswers[Math.floor(Math.random() * offlineAnswers.length)];
  }
}

// Full coordinate list constructor for Match 1 (Live)
function initializeLivePlayers(): PlayerCoord[] {
  const coords: PlayerCoord[] = [];
  // Load Madrid Base
  for (const [id, base] of Object.entries(homeBaseCoords)) {
    const playerDef = matches["match-1"].homeTeam.roster.find(p => p.id === id);
    coords.push({
      id,
      name: playerDef?.name || "Player",
      team: "home",
      x: base.x,
      y: base.y,
      number: playerDef?.number || 10,
      position: base.role
    });
  }
  // Load City Base
  for (const [id, base] of Object.entries(awayBaseCoords)) {
    const playerDef = matches["match-1"].awayTeam.roster.find(p => p.id === id);
    coords.push({
      id,
      name: playerDef?.name || "Player",
      team: "away",
      x: base.x,
      y: base.y,
      number: playerDef?.number || 10,
      position: base.role
    });
  }
  return coords;
}

// Initial hydration of Match 1
matches["match-1"].players = initializeLivePlayers();

// Real-time football game simulator loop (Runs as a background service)
setInterval(() => {
  const match = matches["match-1"];
  
  if (match.status !== "live") return;
  
  // Advance simulated clock
  match.minute += 1;
  if (match.minute > 94) {
    // End match briefly, present full-time summary, then restart
    match.status = "completed";
    
    const finalEvent: MatchEvent = {
      id: `end-${Date.now()}`,
      time: "90+5'",
      type: "INFO",
      description: `The referee blows the final whistle! Match ends: Real Madrid ${match.homeTeam.score} - ${match.awayTeam.score} Manchester City. What an absolute epic thriller!`
    };
    match.events.push(finalEvent);
    broadcastToRoom("match-1", { type: "match:update", state: match });
    triggerClydeAutoCommentary(`The match concludes in an unforgettable ${match.homeTeam.score}-${match.awayTeam.score} draw! A tactical absolute masterpiece.`);

    // Set countdown to re-launch in 30 seconds
    setTimeout(() => {
      // Fast-reset match for endless premium loops
      match.minute = 60;
      match.homeTeam.score = 2;
      match.awayTeam.score = 2;
      match.shotsHome = 12;
      match.shotsAway = 14;
      match.foulsHome = 8;
      match.foulsAway = 9;
      match.savesHome = 5;
      match.savesAway = 4;
      match.events = match.events.filter(e => !e.id.startsWith("sim-") && !e.id.startsWith("end-"));
      match.status = "live";
      
      const restartEvent: MatchEvent = {
        id: `sim-restart-${Date.now()}`,
        time: "60'",
        type: "INFO",
        description: "The second half resumes with intensity! High stake soccer action back live!"
      };
      match.events.push(restartEvent);
      broadcastToRoom("match-1", { type: "match:update", state: match });
      triggerClydeAutoCommentary("We are back underway with tactical shifts! This duel of champions remains completely open!");
    }, 30000);
    return;
  }

  // Update dynamic players coords
  // Move players slightly around their base targets
  match.players.forEach((p) => {
    const base = p.team === "home" ? homeBaseCoords[p.id] : awayBaseCoords[p.id];
    if (base) {
      // Wander slightly (+- 4 units)
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      p.x = Math.max(2, Math.min(98, base.x + dx));
      p.y = Math.max(2, Math.min(98, base.y + dy));
    }
  });

  // Calculate ball physics & possessor activity
  const now = Date.now();
  if (now - lastSimActionTime > 8000) {
    // Switch action ticker: pass, intercept, dribble or shot
    lastSimActionTime = now;
    const rng = Math.random();
    
    const curPossessor = match.players.find(p => p.id === ballOwnerId);
    const posTeam = curPossessor?.team || "home";

    // Track statistics metrics slightly
    if (posTeam === "home") {
      possessionTicks.home += 1;
    } else {
      possessionTicks.away += 1;
    }
    const totalTicks = possessionTicks.home + possessionTicks.away;
    match.possession = Math.round((possessionTicks.home / totalTicks) * 100);

    if (rng < 0.55) {
      // Pass ball to teammate
      const teammates = match.players.filter(p => p.team === posTeam && p.id !== ballOwnerId);
      if (teammates.length > 0) {
        const receiver = teammates[Math.floor(Math.random() * teammates.length)];
        const passerDef = (posTeam === "home" ? match.homeTeam : match.awayTeam).roster.find(p => p.id === ballOwnerId);
        const receiverDef = (posTeam === "home" ? match.homeTeam : match.awayTeam).roster.find(p => p.id === receiver.id);
        
        if (passerDef) {
          passerDef.stats.passes += 1;
          if (Math.random() < 0.9) passerDef.stats.passAccuracy = Math.min(99, Math.round((passerDef.stats.passAccuracy * 9 + 100) / 10));
        }

        ballOwnerId = receiver.id;
        targetBallX = receiver.x;
        targetBallY = receiver.y;
        transitionProgress = 0;
      }
    } else if (rng < 0.8) {
      // Interception by opponent
      const opponents = match.players.filter(p => p.team !== posTeam);
      if (opponents.length > 0) {
        const interceptor = opponents[Math.floor(Math.random() * opponents.length)];
        const interceptorDef = (interceptor.team === "home" ? match.homeTeam : match.awayTeam).roster.find(p => p.id === interceptor.id);
        
        if (interceptorDef) {
          interceptorDef.stats.tackles += 1;
          interceptorDef.rating = Math.min(10, Number((interceptorDef.rating + 0.1).toFixed(1)));
        }

        ballOwnerId = interceptor.id;
        targetBallX = interceptor.x;
        targetBallY = interceptor.y;
        transitionProgress = 0;
      }
    } else {
      // Shot chance generated!
      const shooterName = curPossessor?.name || "Attacker";
      const shooterDef = (posTeam === "home" ? match.homeTeam : match.awayTeam).roster.find(p => p.id === ballOwnerId);
      
      if (shooterDef) {
        shooterDef.stats.shots += 1;
      }

      const shotOutcome = Math.random();
      const actionTeam = posTeam;
      
      if (actionTeam === "home") {
        match.shotsHome += 1;
      } else {
        match.shotsAway += 1;
      }

      if (shotOutcome < 0.18) {
        // GOAL!
        if (actionTeam === "home") {
          match.homeTeam.score += 1;
        } else {
          match.awayTeam.score += 1;
        }
        
        if (shooterDef) {
          shooterDef.stats.goals += 1;
          shooterDef.rating = Math.min(10, Number((shooterDef.rating + 0.8).toFixed(1)));
        }

        const goalEvent: MatchEvent = {
          id: `sim-goal-${Date.now()}`,
          time: `${match.minute}'`,
          type: "GOAL",
          player: shooterName,
          team: actionTeam,
          description: `GOAAAAL! Incredible goal by ${shooterName}! Sweeps it clean into the upper counter from inside the box!`
        };
        match.events.unshift(goalEvent);
        
        // Instant trigger ball to center goal line
        targetBallX = actionTeam === "home" ? 100 : 0;
        targetBallY = 50;
        transitionProgress = 0;

        triggerClydeAutoCommentary(`Goal scores for ${actionTeam === "home" ? match.homeTeam.name : match.awayTeam.name}! Finished beautifully by ${shooterName}!`);
      } else if (shotOutcome < 0.6) {
        // Goalkeeper SAVE
        if (actionTeam === "home") {
          match.savesAway += 1;
          const gk = match.awayTeam.roster.find(p => p.position === "GK");
          if (gk) {
            gk.rating = Math.min(10, Number((gk.rating + 0.3).toFixed(1)));
          }
        } else {
          match.savesHome += 1;
          const gk = match.homeTeam.roster.find(p => p.position === "GK");
          if (gk) {
            gk.rating = Math.min(10, Number((gk.rating + 0.3).toFixed(1)));
          }
        }

        const saveEvent: MatchEvent = {
          id: `sim-save-${Date.now()}`,
          time: `${match.minute}'`,
          type: "SAVE",
          player: shooterName,
          team: actionTeam,
          description: `Crucial save! ${shooterName} unleashes a power strike, but the goalkeeper leaps to tip it around the post!`
        };
        match.events.unshift(saveEvent);
        
        targetBallX = actionTeam === "home" ? 96 : 4;
        targetBallY = 50 + (Math.random() - 0.5) * 15;
        transitionProgress = 0;
      } else {
        // Shot goes off target/FOUL
        const isFoul = Math.random() < 0.4;
        if (isFoul) {
          const foulTeam = actionTeam === "home" ? "away" : "home";
          if (foulTeam === "home") {
            match.foulsHome += 1;
          } else {
            match.foulsAway += 1;
          }

          const hasCard = Math.random() < 0.35;
          let fileCardEvent = "";
          if (hasCard) {
            if (foulTeam === "home") {
              match.yellowHome += 1;
            } else {
              match.yellowAway += 1;
            }
            fileCardEvent = " - Yellow Card issued!";
          }

          const foulEvent: MatchEvent = {
            id: `sim-foul-${Date.now()}`,
            time: `${match.minute}'`,
            type: hasCard ? "CARD_YELLOW" : "FOUL",
            team: foulTeam,
            description: `Match Foul: Aggressive challenge brings down player${fileCardEvent}. Referee stops play.`
          };
          match.events.unshift(foulEvent);
        }
        
        targetBallX = actionTeam === "home" ? 98 : 2;
        targetBallY = Math.random() < 0.5 ? 10 : 90;
        transitionProgress = 0;
      }
    }
  }

  // Smooth ball coordinates slider interpolation
  if (transitionProgress < 1) {
    transitionProgress += 0.25; // complete in 4 ticks
    simBallX = simBallX + (targetBallX - simBallX) * transitionProgress;
    simBallY = simBallY + (targetBallY - simBallY) * transitionProgress;
  } else {
    // Stick to current ball owner
    const possessor = match.players.find(p => p.id === ballOwnerId);
    if (possessor) {
      simBallX = possessor.x;
      simBallY = possessor.y;
    }
  }

  match.ball = { x: Math.round(simBallX), y: Math.round(simBallY) };

  // Gradually increment distance ran for active players
  match.homeTeam.roster.forEach(p => p.stats.distanceRan += 0.05);
  match.awayTeam.roster.forEach(p => p.stats.distanceRan += 0.05);

  // Broadcast live updates to room occupants
  broadcastToRoom("match-1", { type: "match:update", state: match });
}, 1000);

// Setup WebSockets server
const wss = new WebSocketServer({ noServer: true });
const clientsByRoom: Record<string, Set<{ ws: WebSocket; username: string; supportTeam: string; avatar: string }>> = {
  "match-1": new Set(),
  "match-2": new Set(),
  "match-3": new Set()
};

function broadcastToRoom(room: string, payload: any) {
  const list = clientsByRoom[room];
  if (!list) return;
  const serialized = JSON.stringify(payload);
  list.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(serialized);
    }
  });
}

function sendPresenceUpdate(room: string) {
  const list = clientsByRoom[room];
  if (!list) return;
  const presenceList = Array.from(list).map(client => ({
    username: client.username,
    supportTeam: client.supportTeam,
    avatar: client.avatar
  }));
  broadcastToRoom(room, { type: "room:presence", presence: presenceList });
}

wss.on("connection", (ws: WebSocket) => {
  let activeRoom = "";
  let clientIdentifier: { ws: WebSocket; username: string; supportTeam: string; avatar: string } | null = null;

  ws.on("message", async (msgStr: string) => {
    try {
      const payload = JSON.parse(msgStr);
      
      if (payload.type === "join") {
        const { matchId, username, supportTeam, avatar } = payload;
        activeRoom = matchId || "match-1";
        
        clientIdentifier = {
          ws,
          username: username || `Fan_${Math.floor(Math.random() * 1000)}`,
          supportTeam: supportTeam || "neutral",
          avatar: avatar || "⚽"
        };
        
        if (clientsByRoom[activeRoom]) {
          clientsByRoom[activeRoom].add(clientIdentifier);
        }
        
        // Respond with current cached messages & score hydration
        ws.send(JSON.stringify({
          type: "room:sync",
          matchState: matches[activeRoom],
          history: chatMessages[activeRoom] || []
        }));
        
        sendPresenceUpdate(activeRoom);
      } 
      
      else if (payload.type === "chat:send") {
        if (!activeRoom || !clientIdentifier) return;
        
        const timestamp = Date.now();
        const chatID = `chat-${timestamp}-${Math.floor(Math.random() * 1000)}`;
        
        const message: ChatMessage = {
          id: chatID,
          matchId: activeRoom,
          username: clientIdentifier.username,
          text: payload.text,
          timestamp,
          avatar: clientIdentifier.avatar,
          supportTeam: clientIdentifier.supportTeam
        };
        
        if (!chatMessages[activeRoom]) {
          chatMessages[activeRoom] = [];
        }
        chatMessages[activeRoom].push(message);
        broadcastToRoom(activeRoom, { type: "chat:new", message });

        // Trigger Clyde AI interactive responses if tagged or match-1 general commentary trigger
        const botTrigger = payload.text.toLowerCase().includes("@clyde") || payload.text.toLowerCase().includes("clyde");
        if (botTrigger && activeRoom === "match-1") {
          // Send thinking response briefly
          const thinkingId = `ai-thinking-${Date.now()}`;
          broadcastToRoom(activeRoom, {
            type: "chat:typing",
            author: "Clyde AI 📻"
          });

          const responseText = await answerFanQuery(payload.text, clientIdentifier.supportTeam);
          
          const aiReply: ChatMessage = {
            id: `reply-${Date.now()}`,
            matchId: activeRoom,
            username: "Clyde AI 📻",
            text: responseText,
            timestamp: Date.now(),
            avatar: "🎙️",
            isAi: true
          };
          chatMessages[activeRoom].push(aiReply);
          broadcastToRoom(activeRoom, { type: "chat:new", message: aiReply });
        }
      }
    } catch (e) {
      console.error("Socket processing error:", e);
    }
  });

  ws.on("close", () => {
    if (activeRoom && clientIdentifier) {
      clientsByRoom[activeRoom]?.delete(clientIdentifier);
      sendPresenceUpdate(activeRoom);
    }
  });
});

// JSON REST endpoints for manual fallback polling
app.use(express.json());

app.get("/api/matches", (req, res) => {
  res.json(Object.values(matches));
});

app.get("/api/matches/:id", (req, res) => {
  const match = matches[req.params.id];
  if (match) {
    res.json(match);
  } else {
    res.status(404).json({ error: "Match not found" });
  }
});

// Serve client assets in dev mode using Vite middleware, or fallback static build folder
const serveStaticClient = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log("Serving Production Static Assets from", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
};

serveStaticClient().then(() => {
  // Bind WebSocket server to HTTP server
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Live Football Stream & Fan Hub booted on http://localhost:${PORT}`);
  });
});
