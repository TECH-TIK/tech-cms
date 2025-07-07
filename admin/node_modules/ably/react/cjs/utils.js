"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = void 0;
/**
 * In rare cases when we need to access core logger to log error messages
 *
 * @param ablyClient ably core SDK client, it has any type because we access internal Logger class
 * @param message message to log
 */
const logError = (ablyClient, message) => {
    try {
        ablyClient.Logger.logAction(ablyClient.logger, ablyClient.Logger.LOG_ERROR, `[react-hooks] ${message}`);
    }
    catch (error) {
        // we don't want to fail on logger if something change
        console.error(`Unable to access ably-js logger, while sending ${message}`);
    }
};
exports.logError = logError;
//# sourceMappingURL=utils.js.map