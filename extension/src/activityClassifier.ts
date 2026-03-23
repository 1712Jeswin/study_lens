import type { ActivityType, SessionEntry, DailyInsight, SiteCategory } from './types/index.js'
import { classifySite } from './classifier.js'

const KNOWN_TOPICS: Record<string, string> = {
  'dynamic-programming': 'dynamic-programming',
  'dp': 'dynamic-programming',
  'binary-search': 'binary-search',
  'linked-list': 'linked-list',
  'linked-lists': 'linked-list',
  'tree': 'trees',
  'trees': 'trees',
  'binary-tree': 'trees',
  'graph': 'graphs',
  'graphs': 'graphs',
  'backtracking': 'backtracking',
  'recursion': 'recursion',
  'sorting': 'sorting',
  'array': 'arrays',
  'arrays': 'arrays',
  'string': 'strings',
  'strings': 'strings',
  'stack': 'stacks-queues',
  'queue': 'stacks-queues',
  'heap': 'heaps',
  'trie': 'tries',
  'greedy': 'greedy',
  'bit-manipulation': 'bit-manipulation',
  'math': 'math',
  'system-design': 'system-design',
  'design': 'system-design',
  'hash-table': 'hashing',
  'hashing': 'hashing',
  'sliding-window': 'sliding-window',
  'two-pointers': 'two-pointers',
}

/**
 * Classifies a URL into a specific activity type based on URL path patterns.
 * Returns the first match from a prioritised list of domain+path rules.
 * Falls back to the site's category for generic classification.
 *
 * @param url - The full URL string from the Chrome tab
 * @returns The ActivityType this URL best matches
 */
export function classifyActivity(url: string): ActivityType {
  let domain: string | null
  let path: string

  try {
    const parsed = new URL(url)
    domain = parsed.hostname.replace(/^www\./, '')
    path = parsed.pathname.toLowerCase()
  } catch {
    return 'uncategorized'
  }

  // ── AI sites ──────────────────────────────────────────────
  if (domain === 'chatgpt.com' || domain === 'chat.openai.com') {
    if (path.includes('/c/')) return 'conversation'
    return 'browsing'
  }

  if (domain === 'claude.ai') {
    if (path.includes('/chat/')) return 'conversation'
    return 'browsing'
  }

  if (domain === 'gemini.google.com' || domain === 'copilot.microsoft.com' || domain === 'perplexity.ai') {
    return 'conversation'
  }

  // ── Coding practice sites ─────────────────────────────────
  if (domain === 'leetcode.com') {
    if (/\/contest\//.test(path)) return 'contest'
    if (/\/problems\/[^/]+\/?$/.test(path)) return 'practice'
    if (/\/submissions\//.test(path)) return 'review'
    if (/\/discuss\//.test(path)) return 'reading'
    if (/\/explore\//.test(path)) return 'structured'
    return 'reading'
  }

  if (domain === 'geeksforgeeks.org') {
    if (path.startsWith('/practice')) return 'practice'
    if (path.startsWith('/quiz')) return 'practice'
    return 'reading'
  }

  if (domain === 'codeforces.com') {
    if (/\/contest\//.test(path)) return 'contest'
    if (/\/problem\//.test(path)) return 'practice'
    return 'reading'
  }

  if (domain === 'hackerrank.com') {
    if (path.includes('/challenges/')) return 'practice'
    return 'reading'
  }

  if (domain === 'codewars.com') {
    if (path.includes('/kata/')) return 'practice'
    return 'reading'
  }

  // ── GitHub — project work ─────────────────────────────────
  if (domain === 'github.com') {
    if (/\/blob\//.test(path)) return 'project'
    if (/\/pull\//.test(path)) return 'project'
    if (/\/commit/.test(path)) return 'review'
    if (/\/issues/.test(path)) return 'reading'
    return 'project'
  }

  // ── Video / structured learning ───────────────────────────
  if (domain === 'youtube.com' || domain === 'youtu.be') {
    if (path.startsWith('/watch')) return 'video'
    return 'reading'
  }

  if (domain === 'coursera.org') {
    if (path.includes('/lecture/')) return 'video'
    if (path.includes('/learn/')) return 'structured'
    return 'reading'
  }

  if (domain === 'udemy.com') {
    if (path.includes('/learn/')) return 'video'
    return 'reading'
  }

  // ── Other study sites default to reading ──────────────────
  const category: SiteCategory = classifySite(url)
  if (category === 'study') return 'reading'

  // ── Distraction sites ─────────────────────────────────────
  if (category === 'distraction') return 'distraction'

  // ── Default ───────────────────────────────────────────────
  return 'uncategorized'
}

/**
 * Extracts a standardised topic tag from a URL path by matching
 * path segments against a list of known DSA topic slugs.
 * Returns null if no recognised topic is found.
 *
 * @param url - The full URL string to extract a topic from
 * @returns A standardised topic name string, or null
 */
export function extractTopicTag(url: string): string | null {
  let path: string
  let domain: string | null

  try {
    const parsed = new URL(url)
    path = parsed.pathname.toLowerCase()
    domain = parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }

  // Check path segments against known topics
  const segments = path.split('/').filter(Boolean)
  for (const segment of segments) {
    const clean = segment.replace(/-\d+$/, '') // strip trailing problem numbers
    if (KNOWN_TOPICS[clean]) return KNOWN_TOPICS[clean]
    // Also check if any known topic appears as a substring
    for (const [key, value] of Object.entries(KNOWN_TOPICS)) {
      if (clean.includes(key)) return value
    }
  }

  // GFG topic pages — path IS the topic
  // e.g. geeksforgeeks.org/dynamic-programming/ → "dynamic-programming"
  if (domain === 'geeksforgeeks.org') {
    const firstSegment = segments[0]
    if (firstSegment && KNOWN_TOPICS[firstSegment]) return KNOWN_TOPICS[firstSegment]
  }

  return null
}

/**
 * Helper: formats seconds into a human-readable minute string for insight messages.
 *
 * @param seconds - The number of seconds to format
 * @returns A formatted string like "25min"
 */
function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)}min`
}

/**
 * Computes a daily insight from the ordered session log.
 * Pure function — takes sessions, returns a DailyInsight object with
 * headline, optional warning, optional suggestion, and key metric numbers.
 *
 * @param sessions - The ordered session log for the day
 * @returns A computed DailyInsight object
 */
export function computeInsight(sessions: SessionEntry[]): DailyInsight {
  // ── AI switch count ─────────────────────────────────────────
  // Count how many times the user switched from coding/study → AI
  let aiSwitchCount = 0
  for (let i = 0; i < sessions.length - 1; i++) {
    const current = sessions[i]
    const next = sessions[i + 1]
    if (
      (current.category === 'coding' || current.category === 'study') &&
      next.category === 'ai' &&
      current.durationSeconds >= 60
    ) {
      aiSwitchCount++
    }
  }

  // ── Deep work blocks ────────────────────────────────────────
  // Consecutive coding/study sessions with no AI or distraction in between
  // A block ends when the user visits an AI site or distraction site
  let deepWorkBlocks = 0
  let longestBlockMinutes = 0
  let currentBlockSeconds = 0

  for (const session of sessions) {
    if (session.category === 'coding' || session.category === 'study') {
      currentBlockSeconds += session.durationSeconds
    } else {
      // Block broken — check if it qualifies as deep work (≥ 25 min)
      if (currentBlockSeconds >= 25 * 60) {
        deepWorkBlocks++
      }
      const blockMinutes = Math.round(currentBlockSeconds / 60)
      if (blockMinutes > longestBlockMinutes) {
        longestBlockMinutes = blockMinutes
      }
      currentBlockSeconds = 0
    }
  }
  // Check the final block
  if (currentBlockSeconds >= 25 * 60) {
    deepWorkBlocks++
  }
  const finalBlockMinutes = Math.round(currentBlockSeconds / 60)
  if (finalBlockMinutes > longestBlockMinutes) {
    longestBlockMinutes = finalBlockMinutes
  }

  // ── Active practice percent ─────────────────────────────────
  let totalPracticeSeconds = 0
  let totalCodingSeconds = 0
  for (const session of sessions) {
    if (session.category === 'coding') {
      totalCodingSeconds += session.durationSeconds
      if (session.activityType === 'practice') {
        totalPracticeSeconds += session.durationSeconds
      }
    }
  }
  const activePracticePercent = totalCodingSeconds === 0
    ? 0
    : Math.round((totalPracticeSeconds / totalCodingSeconds) * 100)

  // ── Independent solves ──────────────────────────────────────
  // Coding sessions where activityType === 'practice', NOT immediately preceded by AI, duration ≥ 300s
  let independentSolves = 0
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i]
    if (
      session.category === 'coding' &&
      session.activityType === 'practice' &&
      session.durationSeconds >= 300
    ) {
      const prev = i > 0 ? sessions[i - 1] : null
      if (!prev || prev.category !== 'ai') {
        independentSolves++
      }
    }
  }

  // ── Totals for headline fallback ────────────────────────────
  let totalAI = 0
  let totalStudy = 0
  for (const session of sessions) {
    if (session.category === 'ai') totalAI += session.durationSeconds
    if (session.category === 'study') totalStudy += session.durationSeconds
  }

  // ── Headline generation (priority order) ────────────────────
  let headline: string
  if (independentSolves >= 3) {
    headline = `You solved ${independentSolves} problems today without AI help`
  } else if (independentSolves >= 1) {
    headline = `You solved ${independentSolves} problem independently today`
  } else if (deepWorkBlocks >= 2) {
    headline = `You had ${deepWorkBlocks} deep work sessions today — good focus`
  } else if (activePracticePercent >= 70) {
    headline = `Strong day — ${activePracticePercent}% of coding time was active practice`
  } else if (aiSwitchCount === 0 && totalAI > 0) {
    headline = 'You used AI without interrupting your coding flow'
  } else {
    headline = `Today: ${formatMinutes(totalCodingSeconds)} coding, ${formatMinutes(totalStudy)} study`
  }

  // ── Warning generation ──────────────────────────────────────
  let warning: string | null = null
  if (aiSwitchCount >= 5) {
    warning = `You opened an AI tool ${aiSwitchCount} times while coding — consider longer solo attempts`
  } else if (aiSwitchCount >= 3) {
    warning = `You switched to AI ${aiSwitchCount} times mid-coding today`
  } else if (activePracticePercent < 30 && totalCodingSeconds > 3600) {
    warning = `Over an hour of coding time, but only ${activePracticePercent}% was active practice`
  } else if (independentSolves === 0 && totalAI > 1800) {
    warning = `You spent ${formatMinutes(totalAI)} on AI tools with no recorded independent solving`
  }

  // ── Suggestion generation (only when warning exists) ────────
  let suggestion: string | null = null
  if (warning !== null) {
    if (aiSwitchCount >= 3) {
      suggestion = 'Try setting a 20-minute timer before opening ChatGPT'
    } else if (activePracticePercent < 30 && totalCodingSeconds > 3600) {
      suggestion = 'Replace one reading session with a timed practice problem'
    } else if (independentSolves === 0 && totalAI > 1800) {
      suggestion = 'Attempt the full problem before consulting AI — even 15 minutes'
    }
  }

  return {
    headline,
    warning,
    suggestion,
    aiSwitchCount,
    deepWorkBlocks,
    activePracticePercent,
    longestBlockMinutes,
    independentSolves,
  }
}
