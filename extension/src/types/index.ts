// index.ts — Core TypeScript definitions for StudyLens. No runtime logic.

// The five possible classifications for any website
export type SiteCategory = 'ai' | 'coding' | 'study' | 'distraction' | 'uncategorized'

// Activity sub-type derived from URL path patterns — no page content reading
export type ActivityType =
  | 'practice'      // active problem solving: leetcode.com/problems/*, gfg.org/practice/*
  | 'contest'       // competitive: leetcode.com/contest/*, codeforces.com/contest/*
  | 'reading'       // passive: gfg.org/[topic]/, leetcode.com/discuss/*, medium.com/*
  | 'video'         // video content: youtube.com/watch*, coursera.org/*/lecture/*
  | 'structured'    // guided path: leetcode.com/explore/*, theodinproject.com/paths/*
  | 'review'        // reviewing past work: leetcode.com/submissions/*, github.com/*/commits/*
  | 'project'       // writing/reading code: github.com/*/blob/*, replit.com/*
  | 'conversation'  // active AI session: chatgpt.com/c/*, claude.ai/chat/*
  | 'browsing'      // AI homepage/idle: chatgpt.com/ with no conversation path
  | 'distraction'   // any distraction category
  | 'uncategorized'

// One day's accumulated time broken down by category (all values in seconds)
export interface DailyRecord {
  date: string // ISO date string "YYYY-MM-DD" e.g. "2026-03-21"
  ai: number // total seconds spent on AI tool sites
  coding: number // total seconds spent on coding practice sites
  study: number // total seconds spent on learning/study sites
  distraction: number // total seconds spent on distraction sites
  uncategorized: number // total seconds on unrecognised sites
  // New optional fields added in Phase 7B
  sessionLog?: SessionEntry[]   // ordered list of today's sessions, newest appended
  topicTags?: TopicTag[]        // aggregated topic data across today's sessions
  insight?: DailyInsight        // computed at popup open time, not stored — generated fresh
  practiceSeconds?: number      // subset of coding: active problem solving time
  contestSeconds?: number       // subset of coding: contest time
  readingSeconds?: number       // subset of coding+study: passive reading time
  videoSeconds?: number         // subset of study: video watching time
  aiConversationSeconds?: number // subset of ai: active conversation (not idle)
}

// One recorded tab visit stored in session order — used for pattern analysis
export interface SessionEntry {
  domain: string
  category: SiteCategory
  activityType: ActivityType
  durationSeconds: number
  topicTag: string | null  // e.g. "dynamic-programming", "binary-search", null if not matched
  startTime: number        // Date.now() — used to preserve chronological order
}

// A topic extracted from URL slug patterns
export interface TopicTag {
  name: string          // "dynamic-programming", "binary-search", "trees", "graphs"
  totalSeconds: number  // total time on URLs matching this topic today
  practiceSeconds: number // subset of totalSeconds where activityType === 'practice'
}

// The computed daily insight — one sentence + optional warning + optional suggestion
export interface DailyInsight {
  headline: string          // "You solved 3 problems without AI help today"
  warning: string | null    // "You switched to AI 6 times while coding — possible dependency pattern"
  suggestion: string | null // "Try solving one problem completely before opening ChatGPT"
  aiSwitchCount: number     // times the user switched from coding/study → AI mid-session
  deepWorkBlocks: number    // sessions ≥ 25 continuous minutes on coding or study
  activePracticePercent: number // (practice seconds / total coding seconds) × 100
  longestBlockMinutes: number   // longest single uninterrupted coding/study session in minutes
  independentSolves: number     // coding sessions NOT immediately preceded by an AI session
}

// Created when a user spends 30+ minutes on an AI site — awaits their yes/no answer
export interface ReflectionEntry {
  sessionId: string // "{domain}-{startTimestamp}" e.g. "chatgpt.com-1742550000000"
  domain: string // hostname only e.g. "chatgpt.com"
  durationSeconds: number // total length of the AI session
  solvedByAI: boolean | null // null = user has not answered yet
  timestamp: number // Date.now() at the moment the session ended
}

// Streak state — updated every day a student meets the minimum activity threshold
export interface StreakData {
  currentStreak: number // consecutive days with 30+ min of coding or study
  longestStreak: number // all-time record
  lastActiveDate: string // ISO date of the last qualifying day "YYYY-MM-DD"
}

// The complete shape of everything stored in chrome.storage.local
export interface StorageSchema {
  records: Record<string, DailyRecord> // keyed by ISO date e.g. { "2026-03-21": {...} }
  streak: StreakData
  pendingReflection: ReflectionEntry | null // max one pending at a time
  reflectionHistory: ReflectionEntry[] // capped at 100 entries (oldest dropped)
  installedAt: number // Date.now() at first install
}

// The output of the dependency score calculation
export interface DependencyScore {
  score: number // integer 0–100
  label: 'healthy' | 'moderate' | 'high' // band the score falls into
  aiSeconds: number // raw AI seconds (for display)
  productiveSeconds: number // ai + coding + study (the denominator)
}

// A tab session currently being timed in background.ts
export interface ActiveSession {
  domain: string // hostname of the active tab e.g. "leetcode.com"
  category: SiteCategory
  startTime: number // Date.now() when this session started
  tabId: number // Chrome's tab identifier
  originalUrl: string // full URL needed for activity sub-classification in Phase 7B
}
