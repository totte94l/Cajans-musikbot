// ANSI escape codes for colors to make logs more readable
const colors = {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m', // Resets color
    dim: '\x1b[2m',   // Dim color for less important parts
};

/**
 * Gets a formatted timestamp string.
 * @returns {string} The formatted timestamp (e.g., "10:51:00").
 */
const getTimestamp = () => new Date().toLocaleTimeString('sv-SE');

/**
 * Formats a message with a timestamp, level, and optional guild ID.
 * @param {string} level - The log level (e.g., 'INFO').
 * @param {string} color - The ANSI color code for the level.
 * @param {string} message - The main log message.
 * @param {string} [guildId] - An optional guild ID for context.
 * @returns {string} The fully formatted log string.
 */
const formatMessage = (level: string, color: string, message: string, guildId?: string) => {
    const timestamp = `${colors.dim}[${getTimestamp()}]${colors.reset}`;
    const levelTag = `${color}[${level.toUpperCase()}]${colors.reset}`;
    const guildTag = guildId ? `${colors.dim}[${guildId}]${colors.reset}` : '';
    return `${timestamp} ${levelTag} ${guildTag} ${message}`;
};

/**
 * Logs an informational message to the console.
 * @param {string} message - The message to log.
 * @param {string} [guildId] - The associated guild ID for context.
 */
export const log = (message: string, guildId?: string) => {
    console.log(formatMessage('info', colors.info, message, guildId));
};

/**
 * Logs a warning message to the console.
 * @param {string} message - The message to log.
 * @param {string} [guildId] - The associated guild ID for context.
 */
export const warn = (message: string, guildId?: string) => {
    console.warn(formatMessage('warn', colors.warn, message, guildId));
};

/**
 * Logs an error message to the console.
 * @param {any} message - The error object or message to log.
 * @param {string} [guildId] - The associated guild ID for context.
 */
export const error = (message: any, guildId?: string) => {
    // If the message is an error object, we print its stack for better debugging.
    const errorMessage = message instanceof Error ? message.stack || message.message : String(message);
    console.error(formatMessage('error', colors.error, errorMessage, guildId));
};
