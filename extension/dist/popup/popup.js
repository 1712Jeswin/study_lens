// popup.ts — Reads from storage.ts, renders UI, handles clicks.
// This is the main logic for the extension's popup interface.
import { getTodayRecord, getStreak, getPendingReflection, addReflectionToHistory, setPendingReflection, getSessionLog, } from '../storage.js';
import { calculateDependencyScore, formatSeconds, } from '../score.js';
import { formatStreak, } from '../streak.js';
import { resolveReflection, getReflectionMessage, } from '../reflection.js';
import { computeInsight, } from '../activityClassifier.js';
/**
 * Entry point for the popup.
 * Runs whenever the user clicks the extension icon.
 */
document.addEventListener('DOMContentLoaded', () => {
    renderPopup().catch(showError);
});
/**
 * Main render loop for the popup.
 * Fetches data from storage and updates all UI sections.
 */
async function renderPopup() {
    try {
        // Parallel fetch all required data to minimize loading time
        const [record, streakData, pending, sessions] = await Promise.all([
            getTodayRecord(),
            getStreak(),
            getPendingReflection(),
            getSessionLog(),
        ]);
        const score = calculateDependencyScore(record);
        const insight = computeInsight(sessions);
        renderReflectionPrompt(pending);
        renderScoreHeader(score);
        renderInsight(insight);
        renderMetrics(insight);
        renderBreakdownTable(record);
        renderTopics(record.topicTags ?? []);
        renderStreak(streakData);
        renderFooterVersion();
        // Hide loading overlay and reveal all sections
        const loadingEl = document.getElementById('loading');
        if (loadingEl)
            loadingEl.classList.add('hidden');
        const revealIds = [
            'score-header', 'insight-section', 'metrics-section',
            'breakdown-section', 'footer-section',
        ];
        revealIds.forEach(id => {
            const el = document.getElementById(id);
            if (el)
                el.removeAttribute('hidden');
        });
    }
    catch (error) {
        console.error('[StudyLens popup] Render failed:', error);
        showError(error);
    }
}
/**
 * Renders the self-reflection prompt if an AI session just ended.
 *
 * @param entry - The pending reflection entry or null
 */
function renderReflectionPrompt(entry) {
    const section = document.getElementById('reflection-prompt');
    const messageEl = document.getElementById('reflection-message');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    if (!section || !messageEl || !btnYes || !btnNo)
        return;
    if (!entry) {
        section.setAttribute('hidden', 'true');
        return;
    }
    section.removeAttribute('hidden');
    messageEl.textContent = getReflectionMessage(entry.domain, entry.durationSeconds);
    // Attach button listeners (one-time handlers for current prompt)
    btnYes.onclick = () => handleReflection(true);
    btnNo.onclick = () => handleReflection(false);
}
/**
 * Handles the user's response to the reflection prompt.
 *
 * @param solvedByAI - Whether the user answered 'Yes'
 */
async function handleReflection(solvedByAI) {
    try {
        const entry = await getPendingReflection();
        if (!entry)
            return;
        const resolved = resolveReflection(entry, solvedByAI);
        // Write to history
        await addReflectionToHistory(resolved);
        // Clear pending
        await setPendingReflection(null);
        // Re-render popup to hide the prompt
        await renderPopup();
    }
    catch (error) {
        console.error('[StudyLens popup] Reflection handling failed:', error);
    }
}
/**
 * Renders the score header section with the animated SVG ring.
 *
 * @param score - The computed dependency score metrics
 */
function renderScoreHeader(score) {
    const valueEl = document.getElementById('score-value');
    const labelEl = document.getElementById('score-label');
    const dateEl = document.getElementById('score-date');
    const ringFill = document.getElementById('ring-fill');
    if (!valueEl || !labelEl || !dateEl || !ringFill)
        return;
    // Set score text
    valueEl.textContent = score.score.toString();
    // Set label text and colour
    labelEl.textContent = score.label;
    // Colour map for the score bands
    const colourMap = {
        healthy: '#1D9E75',
        moderate: '#BA7517',
        high: '#E24B4A',
    };
    const colour = colourMap[score.label] ?? '#1D9E75';
    labelEl.style.color = colour;
    // Set today's formatted date: "Monday, 21 March"
    const now = new Date();
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    };
    dateEl.textContent = now.toLocaleDateString('en-GB', options);
    // Animate the SVG ring: circumference = 2π × 32 ≈ 201
    const circumference = 201;
    const offset = circumference - (score.score / 100) * circumference;
    ringFill.setAttribute('stroke-dashoffset', offset.toString());
    ringFill.setAttribute('stroke', colour);
}
/**
 * Renders the insight card with headline, optional warning, and optional suggestion.
 *
 * @param insight - The computed daily insight
 */
function renderInsight(insight) {
    const section = document.getElementById('insight-section');
    const headlineEl = document.getElementById('insight-headline');
    const warningEl = document.getElementById('insight-warning');
    const suggestionEl = document.getElementById('insight-suggestion');
    if (!section || !headlineEl || !warningEl || !suggestionEl)
        return;
    headlineEl.textContent = insight.headline;
    if (insight.warning) {
        warningEl.textContent = insight.warning;
        warningEl.removeAttribute('hidden');
        section.classList.add('has-warning');
    }
    else {
        warningEl.setAttribute('hidden', 'true');
        section.classList.remove('has-warning');
    }
    if (insight.suggestion) {
        suggestionEl.textContent = insight.suggestion;
        suggestionEl.removeAttribute('hidden');
    }
    else {
        suggestionEl.setAttribute('hidden', 'true');
    }
}
/**
 * Renders the three metric cards (AI switches, deep sessions, active practice %).
 *
 * @param insight - The computed daily insight containing metric numbers
 */
function renderMetrics(insight) {
    const switchesEl = document.getElementById('metric-switches');
    const deepworkEl = document.getElementById('metric-deepwork');
    const practiceEl = document.getElementById('metric-practice');
    if (!switchesEl || !deepworkEl || !practiceEl)
        return;
    switchesEl.textContent = insight.aiSwitchCount.toString();
    deepworkEl.textContent = insight.deepWorkBlocks.toString();
    practiceEl.textContent = `${insight.activePracticePercent}%`;
}
// ── Type label helper functions (private, not exported) ─────
/**
 * Builds the AI type label from the daily record's activity breakdown.
 *
 * @param record - Today's DailyRecord
 * @returns A formatted type label string
 */
function buildAITypeLabel(record) {
    const conv = record.aiConversationSeconds ?? 0;
    if (conv === 0)
        return '—';
    return `Chat: ${formatSeconds(conv)}`;
}
/**
 * Builds the Coding type label from the daily record's activity breakdown.
 *
 * @param record - Today's DailyRecord
 * @returns A formatted type label string
 */
function buildCodingTypeLabel(record) {
    const practice = record.practiceSeconds ?? 0;
    const contest = record.contestSeconds ?? 0;
    if (practice === 0 && contest === 0)
        return 'Reading';
    if (contest > 0)
        return `Contest: ${formatSeconds(contest)}`;
    return `Practice: ${formatSeconds(practice)}`;
}
/**
 * Builds the Study type label from the daily record's activity breakdown.
 *
 * @param record - Today's DailyRecord
 * @returns A formatted type label string
 */
function buildStudyTypeLabel(record) {
    const video = record.videoSeconds ?? 0;
    if (video > 0)
        return `Video: ${formatSeconds(video)}`;
    return 'Reading';
}
/**
 * Renders the breakdown table with four category rows.
 * Each row has: coloured dot + name, formatted time, activity type, and a bar.
 * Uses createElement to avoid innerHTML (XSS prevention even with local data).
 *
 * @param record - Today's DailyRecord
 */
function renderBreakdownTable(record) {
    const tbody = document.getElementById('breakdown-body');
    if (!tbody)
        return;
    tbody.replaceChildren(); // Clear previous render
    const rows = [
        { label: 'AI tools', seconds: record.ai, colour: '#E24B4A', typeLabel: buildAITypeLabel(record) },
        { label: 'Coding', seconds: record.coding, colour: '#185FA5', typeLabel: buildCodingTypeLabel(record) },
        { label: 'Study', seconds: record.study, colour: '#1D9E75', typeLabel: buildStudyTypeLabel(record) },
        { label: 'Distraction', seconds: record.distraction, colour: '#888780', typeLabel: '—' },
    ];
    // Bar width: percentage of total of all four categories
    const totalAll = record.ai + record.coding + record.study + record.distraction + record.uncategorized;
    const barWidth = (seconds) => totalAll === 0 ? '0%' : Math.round((seconds / totalAll) * 100) + '%';
    rows.forEach(row => {
        const tr = document.createElement('tr');
        // Column 1: coloured dot + category name
        const td1 = document.createElement('td');
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'breakdown-category';
        const dot = document.createElement('span');
        dot.className = 'breakdown-dot';
        dot.style.backgroundColor = row.colour;
        const labelSpan = document.createElement('span');
        labelSpan.textContent = row.label;
        categoryDiv.appendChild(dot);
        categoryDiv.appendChild(labelSpan);
        td1.appendChild(categoryDiv);
        tr.appendChild(td1);
        // Column 2: formatted time
        const td2 = document.createElement('td');
        td2.className = 'breakdown-time';
        td2.textContent = formatSeconds(row.seconds);
        tr.appendChild(td2);
        // Column 3: activity type descriptor
        const td3 = document.createElement('td');
        td3.className = 'breakdown-type';
        td3.textContent = row.typeLabel;
        tr.appendChild(td3);
        // Column 4: horizontal bar
        const td4 = document.createElement('td');
        td4.className = 'breakdown-bar-cell';
        const track = document.createElement('div');
        track.className = 'breakdown-bar-track';
        const fill = document.createElement('div');
        fill.className = 'breakdown-bar-fill';
        fill.style.width = barWidth(row.seconds);
        fill.style.backgroundColor = row.colour;
        track.appendChild(fill);
        td4.appendChild(track);
        tr.appendChild(td4);
        tbody.appendChild(tr);
    });
}
/**
 * Renders topic tag pills in a horizontally scrolling row.
 * Hides the entire section if no tags are available.
 *
 * @param tags - Array of TopicTag objects for today
 */
function renderTopics(tags) {
    const section = document.getElementById('topics-section');
    const container = document.getElementById('topics-container');
    if (!section || !container)
        return;
    container.replaceChildren(); // Clear previous render
    if (tags.length === 0) {
        section.setAttribute('hidden', 'true');
        return;
    }
    tags.forEach(tag => {
        const pill = document.createElement('div');
        pill.className = 'topic-pill';
        if (tag.practiceSeconds > 0) {
            pill.classList.add('has-practice');
        }
        // Pill dot
        const dot = document.createElement('span');
        dot.className = 'topic-dot';
        pill.appendChild(dot);
        // Pill text: "topic-name (Xm)"
        const text = document.createElement('span');
        text.textContent = `${tag.name} (${formatSeconds(tag.totalSeconds)})`;
        pill.appendChild(text);
        container.appendChild(pill);
    });
    section.removeAttribute('hidden');
}
/**
 * Renders the current study streak in the footer.
 *
 * @param streak - Current streak data
 */
function renderStreak(streak) {
    const countEl = document.getElementById('streak-count');
    const labelEl = document.getElementById('streak-label');
    if (!countEl || !labelEl)
        return;
    countEl.textContent = formatStreak(streak);
    if (streak.currentStreak === 0) {
        labelEl.textContent = 'Keep it up!';
    }
    else {
        labelEl.textContent = `Best: ${streak.longestStreak} days`;
    }
}
/**
 * Sets the version text in the footer.
 */
function renderFooterVersion() {
    const versionEl = document.getElementById('footer-version');
    if (!versionEl)
        return;
    versionEl.textContent = 'StudyLens v1.0';
}
/**
 * Displays a fallback error message in the UI if something fails.
 *
 * @param error - The error caught
 */
function showError(error) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.textContent = 'Something went wrong. Try reloading StudyLens.';
        loadingEl.style.color = '#E24B4A';
        loadingEl.style.padding = '16px';
        loadingEl.style.textAlign = 'center';
    }
    console.error('[StudyLens popup] Critical error:', error);
}
