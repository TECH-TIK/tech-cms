"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannel = void 0;
const react_1 = require("react");
const useAbly_js_1 = require("./useAbly.js");
const useStateErrors_js_1 = require("./useStateErrors.js");
const useChannelInstance_js_1 = require("./useChannelInstance.js");
const useChannelAttach_js_1 = require("./useChannelAttach.js");
function useChannel(channelNameOrNameAndOptions, eventOrCallback, callback) {
    const channelHookOptions = typeof channelNameOrNameAndOptions === 'object'
        ? channelNameOrNameAndOptions
        : { channelName: channelNameOrNameAndOptions };
    const ably = (0, useAbly_js_1.useAbly)(channelHookOptions.ablyId);
    const { channelName, skip } = channelHookOptions;
    const { channel, derived } = (0, useChannelInstance_js_1.useChannelInstance)(channelHookOptions.ablyId, channelName);
    const publish = (0, react_1.useMemo)(() => {
        if (!derived)
            return channel.publish.bind(channel);
        const regularChannel = ably.channels.get(channelName);
        // For derived channels we use transient publish (it won't attach to the channel)
        return regularChannel.publish.bind(regularChannel);
    }, [ably.channels, derived, channel, channelName]);
    const channelEvent = typeof eventOrCallback === 'string' ? eventOrCallback : null;
    const ablyMessageCallback = typeof eventOrCallback === 'string' ? callback : eventOrCallback;
    const ablyMessageCallbackRef = (0, react_1.useRef)(ablyMessageCallback);
    const { connectionError, channelError } = (0, useStateErrors_js_1.useStateErrors)(channelHookOptions);
    (0, react_1.useEffect)(() => {
        ablyMessageCallbackRef.current = ablyMessageCallback;
    }, [ablyMessageCallback]);
    (0, react_1.useEffect)(() => {
        const listener = ablyMessageCallbackRef.current
            ? (message) => {
                ablyMessageCallbackRef.current && ablyMessageCallbackRef.current(message);
            }
            : null;
        const subscribeArgs = listener
            ? channelEvent === null
                ? [listener]
                : [channelEvent, listener]
            : null;
        if (!skip && subscribeArgs) {
            handleChannelMount(channel, ...subscribeArgs);
        }
        return () => {
            !skip && subscribeArgs && handleChannelUnmount(channel, ...subscribeArgs);
        };
    }, [channelEvent, channel, skip]);
    (0, useChannelAttach_js_1.useChannelAttach)(channel, channelHookOptions.ablyId, skip);
    return { channel, publish, ably, connectionError, channelError };
}
exports.useChannel = useChannel;
async function handleChannelMount(channel, ...subscribeArgs) {
    await channel.subscribe(...subscribeArgs);
}
async function handleChannelUnmount(channel, ...subscribeArgs) {
    await channel.unsubscribe(...subscribeArgs);
}
//# sourceMappingURL=useChannel.js.map