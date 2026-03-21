// streak.ts — Pure function: dates in → StreakData out
/**
 * Helper to get today's date in ISO YYYY-MM-DD format.
 *
 * @returns Today's date string
 */
export function getTodayISO() {
    return new Date().toISOString().slice(0, 10);
}
/**
 * Helper to get yesterday's date in ISO YYYY-MM-DD format.
 *
 * @returns Yesterday's date string
 */
export function getYesterdayISO() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
}
/**
 * Calculates whether the current DailyRecord qualifies for extending the streak.
 * Requires at least 30 minutes (1800 seconds) of actual practice (coding + study).
 *
 * @param record - The DailyRecord for the day
 * @returns True if the day meets the streak requirements
 */
export function streakQualifies(record) {
    return (record.coding + record.study) >= 1800;
}
/**
 * Calculates the new streak state based on the current state and whether today qualifies.
 * Never mutates the input; always returns a new object.
 *
 * @param current - The existing StreakData
 * @param todayQualifies - Whether the user has met the streak threshold for today
 * @returns The new StreakData
 */
export function calculateStreak(current, todayQualifies) {
    const today = getTodayISO();
    const yesterday = getYesterdayISO();
    // If lastActiveDate is already today -> return current unchanged (already counted today)
    if (current.lastActiveDate === today) {
        return { ...current };
    }
    // If lastActiveDate is yesterday AND todayQualifies -> increment streak, update date, update longestStreak
    if (current.lastActiveDate === yesterday && todayQualifies) {
        const newStreak = current.currentStreak + 1;
        return {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, current.longestStreak),
            lastActiveDate: today
        };
    }
    // If lastActiveDate is older than yesterday
    const isOlderThanYesterday = current.lastActiveDate !== today && current.lastActiveDate !== yesterday;
    if (isOlderThanYesterday) {
        // -> reset currentStreak to 1 if todayQualifies, else 0
        if (todayQualifies) {
            return {
                currentStreak: 1,
                longestStreak: Math.max(1, current.longestStreak),
                lastActiveDate: today
            };
        }
        else {
            return {
                currentStreak: 0,
                longestStreak: current.longestStreak,
                lastActiveDate: current.lastActiveDate
            };
        }
    }
    // If we reach here, lastActiveDate === yesterday AND !todayQualifies.
    // The streak is not broken until TOMORROW (meaning if they don't play today, 
    // tomorrow it will be older than yesterday). So we return current unchanged.
    return { ...current };
}
/**
 * Formats the streak data into a human-readable string.
 * Includes a flame emoji for streaks of 3 or more days.
 *
 * @param streak - The StreakData to format
 * @returns The formatted streak message
 */
export function formatStreak(streak) {
    if (streak.currentStreak === 0) {
        return 'Start your streak today';
    }
    if (streak.currentStreak < 3) {
        return `${streak.currentStreak}-day streak`;
    }
    return `${streak.currentStreak}-day streak 🔥`;
}
