// index.ts — Core TypeScript definitions for StudyLens. No runtime logic.

// The five possible classifications for any website
export type SiteCategory = 'ai' | 'coding' | 'study' | 'distraction' | 'uncategorized'

// One day's accumulated time broken down by category (all values in seconds)
export interface DailyRecord {
  date: string // ISO date string "YYYY-MM-DD" e.g. "2026-03-21"
  ai: number // total seconds spent on AI tool sites
  coding: number // total seconds spent on coding practice sites
  study: number // total seconds spent on learning/study sites
  distraction: number // total seconds spent on distraction sites
  uncategorized: number // total seconds on unrecognised sites
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
}
