import { useEffect, useMemo, useRef } from 'react';
import { useAbly } from './useAbly.js';
import { useStateErrors } from './useStateErrors.js';
import { useChannelInstance } from './useChannelInstance.js';
import { useChannelAttach } from './useChannelAttach.js';
export function useChannel(channelNameOrNameAndOptions, eventOrCallback, callback) {
    const channelHookOptions = typeof channelNameOrNameAndOptions === 'object'
        ? channelNameOrNameAndOptions
        : { channelName: channelNameOrNameAndOptions };
    const ably = useAbly(channelHookOptions.ablyId);
    const { channelName, skip } = channelHookOptions;
    const { channel, derived } = useChannelInstance(channelHookOptions.ablyId, channelName);
    const publish = useMemo(() => {
        if (!derived)
            return channel.publish.bind(channel);
        const regularChannel = ably.channels.get(channelName);
        // For derived channels we use transient publish (it won't attach to the channel)
        return regularChannel.publish.bind(regularChannel);
    }, [ably.channels, derived, channel, channelName]);
    const channelEvent = typeof eventOrCallback === 'string' ? eventOrCallback : null;
    const ablyMessageCallback = typeof eventOrCallback === 'string' ? callback : eventOrCallback;
    const ablyMessageCallbackRef = useRef(ablyMessageCallback);
    const { connectionError, channelError } = useStateErrors(channelHookOptions);
    useEffect(() => {
        ablyMessageCallbackRef.current = ablyMessageCallback;
    }, [ablyMessageCallback]);
    useEffect(() => {
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
    useChannelAttach(channel, channelHookOptions.ablyId, skip);
    return { channel, publish, ably, connectionError, channelError };
}
async function handleChannelMount(channel, ...subscribeArgs) {
    await channel.subscribe(...subscribeArgs);
}
async function handleChannelUnmount(channel, ...subscribeArgs) {
    await channel.unsubscribe(...subscribeArgs);
}
//# sourceMappingURL=useChannel.js.map