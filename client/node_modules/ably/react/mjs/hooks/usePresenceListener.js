import { useCallback, useEffect, useRef, useState } from 'react';
import { useChannelInstance } from './useChannelInstance.js';
import { useStateErrors } from './useStateErrors.js';
import { useChannelAttach } from './useChannelAttach.js';
export function usePresenceListener(channelNameOrNameAndOptions, onPresenceMessageReceived) {
    const params = typeof channelNameOrNameAndOptions === 'object'
        ? channelNameOrNameAndOptions
        : { channelName: channelNameOrNameAndOptions };
    const skip = params.skip;
    const { channel } = useChannelInstance(params.ablyId, params.channelName);
    const { connectionError, channelError } = useStateErrors(params);
    const [presenceData, updatePresenceData] = useState([]);
    const onPresenceMessageReceivedRef = useRef(onPresenceMessageReceived);
    useEffect(() => {
        onPresenceMessageReceivedRef.current = onPresenceMessageReceived;
    }, [onPresenceMessageReceived]);
    const updatePresence = useCallback(async (message) => {
        var _a;
        const snapshot = await channel.presence.get();
        updatePresenceData(snapshot);
        (_a = onPresenceMessageReceivedRef.current) === null || _a === void 0 ? void 0 : _a.call(onPresenceMessageReceivedRef, message);
    }, [channel.presence]);
    const onMount = useCallback(async () => {
        channel.presence.subscribe(['enter', 'leave', 'update'], updatePresence);
        const snapshot = await channel.presence.get();
        updatePresenceData(snapshot);
    }, [channel.presence, updatePresence]);
    const onUnmount = useCallback(async () => {
        channel.presence.unsubscribe(['enter', 'leave', 'update'], updatePresence);
    }, [channel.presence, updatePresence]);
    useEffect(() => {
        if (skip)
            return;
        onMount();
        return () => {
            onUnmount();
        };
    }, [skip, onMount, onUnmount]);
    useChannelAttach(channel, params.ablyId, skip);
    return { presenceData, connectionError, channelError };
}
//# sourceMappingURL=usePresenceListener.js.map