"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePresenceListener = void 0;
const react_1 = require("react");
const useChannelInstance_js_1 = require("./useChannelInstance.js");
const useStateErrors_js_1 = require("./useStateErrors.js");
const useChannelAttach_js_1 = require("./useChannelAttach.js");
function usePresenceListener(channelNameOrNameAndOptions, onPresenceMessageReceived) {
    const params = typeof channelNameOrNameAndOptions === 'object'
        ? channelNameOrNameAndOptions
        : { channelName: channelNameOrNameAndOptions };
    const skip = params.skip;
    const { channel } = (0, useChannelInstance_js_1.useChannelInstance)(params.ablyId, params.channelName);
    const { connectionError, channelError } = (0, useStateErrors_js_1.useStateErrors)(params);
    const [presenceData, updatePresenceData] = (0, react_1.useState)([]);
    const onPresenceMessageReceivedRef = (0, react_1.useRef)(onPresenceMessageReceived);
    (0, react_1.useEffect)(() => {
        onPresenceMessageReceivedRef.current = onPresenceMessageReceived;
    }, [onPresenceMessageReceived]);
    const updatePresence = (0, react_1.useCallback)(async (message) => {
        var _a;
        const snapshot = await channel.presence.get();
        updatePresenceData(snapshot);
        (_a = onPresenceMessageReceivedRef.current) === null || _a === void 0 ? void 0 : _a.call(onPresenceMessageReceivedRef, message);
    }, [channel.presence]);
    const onMount = (0, react_1.useCallback)(async () => {
        channel.presence.subscribe(['enter', 'leave', 'update'], updatePresence);
        const snapshot = await channel.presence.get();
        updatePresenceData(snapshot);
    }, [channel.presence, updatePresence]);
    const onUnmount = (0, react_1.useCallback)(async () => {
        channel.presence.unsubscribe(['enter', 'leave', 'update'], updatePresence);
    }, [channel.presence, updatePresence]);
    (0, react_1.useEffect)(() => {
        if (skip)
            return;
        onMount();
        return () => {
            onUnmount();
        };
    }, [skip, onMount, onUnmount]);
    (0, useChannelAttach_js_1.useChannelAttach)(channel, params.ablyId, skip);
    return { presenceData, connectionError, channelError };
}
exports.usePresenceListener = usePresenceListener;
//# sourceMappingURL=usePresenceListener.js.map