// score.ts — Pure function: numbers in → DependencyScore out
/**
 * Calculates the AI dependency score based on the productive time spent.
 * The score is the percentage of productive time spent on AI tools.
 *
 * @param record - The DailyRecord containing the time spent in each category
 * @returns The computed DependencyScore
 */
export function calculateDependencyScore(record) {
    const denominator = record.ai + record.coding + record.study;
    if (denominator === 0) {
        // No productive time recorded yet — return safe zero state
        return {
            score: 0,
            label: 'healthy',
            aiSeconds: 0,
            productiveSeconds: 0
        };
    }
    const score = Math.round((record.ai / denominator) * 100);
    let label = 'healthy';
    if (score >= 31 && score <= 60) {
        label = 'moderate';
    }
    else if (score >= 61) {
        label = 'high';
    }
    return {
        score,
        label,
        aiSeconds: record.ai,
        productiveSeconds: denominator
    };
}
/**
 * Formats a number of seconds into a human-readable string (e.g. "1h 1m 30s").
 *
 * @param seconds - The total number of seconds to format
 * @returns A formatted string representing the time
 */
export function formatSeconds(seconds) {
    if (seconds === 0)
        return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (h > 0)
        parts.push(`${h}h`);
    if (m > 0)
        parts.push(`${m}m`);
    if (s > 0)
        parts.push(`${s}s`);
    // Edge case: 3600 -> "1h", 3630 -> "1h 30s".
    // Fallback for weird floats (should never happen, mostly ints but just in case)
    return parts.length > 0 ? parts.join(' ') : '0m';
}
/**
 * Returns the corresponding hex colour string for a given score label.
 *
 * @param label - The classification label ('healthy', 'moderate', or 'high')
 * @returns A hex colour string
 */
export function getScoreColour(label) {
    switch (label) {
        case 'healthy':
            return '#1D9E75'; // green
        case 'moderate':
            return '#BA7517'; // amber
        case 'high':
            return '#E24B4A'; // red
        default:
            return '#1D9E75'; // Fallback to green
    }
}
