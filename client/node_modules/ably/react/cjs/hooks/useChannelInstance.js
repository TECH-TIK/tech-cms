"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelInstance = void 0;
const react_1 = __importDefault(require("react"));
const AblyContext_js_1 = require("../AblyContext.js");
function useChannelInstance(ablyId = 'default', channelName) {
    const channelContext = react_1.default.useContext(AblyContext_js_1.AblyContext)[ablyId]._channelNameToChannelContext[channelName];
    if (!channelContext) {
        throw new Error(`Could not find a parent ChannelProvider in the component tree for channelName="${channelName}". Make sure your channel based hooks (usePresence, useChannel, useChannelStateListener) are called inside a <ChannelProvider> component`);
    }
    return channelContext;
}
exports.useChannelInstance = useChannelInstance;
//# sourceMappingURL=useChannelInstance.js.map