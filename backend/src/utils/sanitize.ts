import DOMPurify from "isomorphic-dompurify";

// Removes all HTML and scripts so only plain text is allowed for fields like usernames and titles
export function sanitizeText(input: string): string {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

// Allows some safe HTML formatting but removes scripts and unsafe stuff
// Use this for things like descriptions or reviews
export function sanitizeRichText(input: string): string {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
        ALLOWED_ATTR: [],
    }).trim();
}