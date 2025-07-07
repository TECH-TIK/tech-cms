/**
 * In rare cases when we need to access core logger to log error messages
 *
 * @param ablyClient ably core SDK client, it has any type because we access internal Logger class
 * @param message message to log
 */
export declare const logError: (ablyClient: any, message: string) => void;
