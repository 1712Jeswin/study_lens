// classifier.ts — Maps website domains to study categories. Pure functions, no side effects, no Chrome APIs.
export const SITE_LISTS = {
    ai: [
        'chatgpt.com',
        'chat.openai.com',
        'claude.ai',
        'gemini.google.com',
        'copilot.microsoft.com',
        'perplexity.ai',
        'poe.com',
        'you.com',
        'phind.com',
        'huggingface.co',
        'replicate.com',
        'mistral.ai',
        'groq.com',
        'together.ai',
        'character.ai',
        'bing.com'
    ],
    coding: [
        'leetcode.com',
        'github.com',
        'stackoverflow.com',
        'codepen.io',
        'replit.com',
        'codesandbox.io',
        'hackerrank.com',
        'codeforces.com',
        'geeksforgeeks.org',
        'developer.mozilla.org',
        'docs.python.org',
        'typescriptlang.org',
        'npmjs.com',
        'jsfiddle.net',
        'glitch.com',
        'exercism.org',
        'codewars.com',
        'atcoder.jp'
    ],
    study: [
        'coursera.org',
        'udemy.com',
        'khanacademy.org',
        'edx.org',
        'youtube.com',
        'youtu.be',
        'notion.so',
        'medium.com',
        'dev.to',
        'hashnode.com',
        'substack.com',
        'brilliant.org',
        'freecodecamp.org',
        'theodinproject.com',
        'roadmap.sh',
        'docs.google.com',
        'wikipedia.org',
        'mit.edu',
        'stanford.edu'
    ],
    distraction: [
        'instagram.com',
        'twitter.com',
        'x.com',
        'reddit.com',
        'netflix.com',
        'twitch.tv',
        'facebook.com',
        'tiktok.com',
        'snapchat.com',
        'discord.com',
        'whatsapp.com',
        'spotify.com',
        'primevideo.com',
        'hotstar.com',
        '9gag.com',
        'buzzfeed.com',
        'dailymotion.com',
        'tumblr.com'
    ]
};
/**
 * Extracts and normalises the hostname from a full URL.
 * Strips the 'www.' prefix so tracking is consistent.
 *
 * @param url - The full URL string to parse (e.g. "https://www.github.com/abc")
 * @returns The normalised hostname (e.g. "github.com"), or null if invalid
 */
export function extractDomain(url) {
    try {
        const hostname = new URL(url).hostname;
        // Strip www. prefix so "www.github.com" and "github.com" both match "github.com"
        return hostname.replace(/^www\./, '');
    }
    catch {
        // new URL() throws for chrome://, about:blank, data:, and malformed strings
        return null;
    }
}
/**
 * Determines if a URL should be tracked by the extension.
 * Skips browser internal pages, local development URLs, and extensions.
 *
 * @param url - The full URL string to check
 * @returns True if the URL is a trackable web page, false otherwise
 */
export function isTrackableUrl(url) {
    if (!url)
        return false;
    try {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol;
        const hostname = parsedUrl.hostname;
        if (protocol === 'chrome:' ||
            protocol === 'about:' ||
            protocol === 'chrome-extension:' ||
            hostname === 'localhost' ||
            hostname === '127.0.0.1') {
            return false;
        }
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Classifies a full URL into one of five study categories.
 * Returns 'uncategorized' for unknown sites and non-trackable URLs.
 * Matches against known domains, handling subdomains automatically.
 *
 * @param url - The full URL string from the Chrome tab
 * @returns The SiteCategory this URL belongs to
 */
export function classifySite(url) {
    if (!isTrackableUrl(url)) {
        return 'uncategorized';
    }
    const domain = extractDomain(url);
    if (!domain) {
        return 'uncategorized';
    }
    const checkCategory = (list) => list.some((site) => domain === site || domain.endsWith(`.${site}`));
    // Check domain against each list in order: ai → coding → study → distraction
    if (checkCategory(SITE_LISTS.ai))
        return 'ai';
    if (checkCategory(SITE_LISTS.coding))
        return 'coding';
    if (checkCategory(SITE_LISTS.study))
        return 'study';
    if (checkCategory(SITE_LISTS.distraction))
        return 'distraction';
    return 'uncategorized';
}
/**
 * Checks if a given category is considered productive time.
 * Distractions and uncategorized time are not productive.
 *
 * @param category - The SiteCategory to evaluate
 * @returns True if the category is 'ai', 'coding', or 'study'
 */
export function isProductiveCategory(category) {
    return category === 'ai' || category === 'coding' || category === 'study';
}
