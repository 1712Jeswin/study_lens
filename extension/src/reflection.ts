// reflection.ts — Logic for AI self-reflection prompts. Pure functions, no Chrome APIs.

import type { ReflectionEntry, ActiveSession } from './types/index.js'

/**
 * The minimum duration (in seconds) an AI session must last to trigger a reflection prompt.
 * 1800 seconds = 30 minutes.
 */
export const REFLECTION_THRESHOLD_SECONDS: number = 1800

/**
 * Determines if a completed session should trigger a self-reflection prompt.
 * Currently only triggers for 'ai' category sessions exceeding the threshold.
 * 
 * @param session - The session details including calculated duration
 * @returns True if a reflection is required
 */
export function shouldTriggerReflection(session: ActiveSession & { durationSeconds: number }): boolean {
  return session.category === 'ai' && session.durationSeconds >= REFLECTION_THRESHOLD_SECONDS
}

/**
 * Creates a new pending ReflectionEntry from an active session.
 * 
 * @param session - The active session that just ended
 * @param durationSeconds - Total duration of the session in seconds
 * @returns A fresh ReflectionEntry for storage
 */
export function createReflectionEntry(session: ActiveSession, durationSeconds: number): ReflectionEntry {
  return {
    sessionId: `${session.domain}-${session.startTime}`,
    domain: session.domain,
    durationSeconds,
    solvedByAI: null, // User has not answered yet
    timestamp: Date.now()
  }
}

/**
 * Resolves a reflection entry with the user's answer.
 * Returns a new object to maintain immutability.
 * 
 * @param entry - The existing ReflectionEntry
 * @param solvedByAI - Whether the user confirmed AI solved it
 * @returns The updated ReflectionEntry
 */
export function resolveReflection(entry: ReflectionEntry, solvedByAI: boolean): ReflectionEntry {
  return {
    ...entry,
    solvedByAI
  }
}

/**
 * Formats a message to present to the user for reflection.
 * 
 * @param domain - The hostname where the session occurred
 * @param durationSeconds - How long the session lasted
 * @returns A human-readable prompt string
 */
export function getReflectionMessage(domain: string, durationSeconds: number): string {
  return `You spent ${formatMinutes(durationSeconds)} on ${domain}. Did AI solve the problem for you, or were you using it as a reference?`
}

/**
 * Internal helper to format seconds into round minutes for the UI.
 * 
 * @param seconds - Total duration in seconds
 * @returns A string like "30 min"
 */
function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60)
  return `${mins} min`
}
