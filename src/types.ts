export interface Player {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  rating: number;
  stats: {
    goals: number;
    assists: number;
    shots: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    distanceRan: number; // km
  };
}

export interface MatchEvent {
  id: string;
  time: string;
  type: "GOAL" | "SHOT" | "SAVE" | "FOUL" | "CARD_YELLOW" | "CARD_RED" | "SUB" | "INFO";
  player?: string;
  team?: "home" | "away";
  description: string;
}

export interface PlayerCoord {
  id: string;
  name: string;
  team: "home" | "away";
  x: number;
  y: number;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
}

export interface MatchState {
  id: string;
  homeTeam: {
    name: string;
    short: string;
    color: string;
    score: number;
    roster: Player[];
  };
  awayTeam: {
    name: string;
    short: string;
    color: string;
    score: number;
    roster: Player[];
  };
  status: "live" | "upcoming" | "completed";
  minute: number;
  possession: number; // Home team possession %
  shotsHome: number;
  shotsAway: number;
  foulsHome: number;
  foulsAway: number;
  savesHome: number;
  savesAway: number;
  yellowHome: number;
  yellowAway: number;
  events: MatchEvent[];
  ball: { x: number; y: number };
  players: PlayerCoord[];
}

export interface ChatMessage {
  id: string;
  matchId: string;
  username: string;
  text: string;
  timestamp: number;
  avatar: string;
  supportTeam?: string; // e.g. "home", "away", or "neutral"
  isAi?: boolean;
}

export interface UserPresence {
  id: string;
  username: string;
  avatar: string;
  supportTeam: "home" | "away" | "neutral";
}
