import { useEventListener } from './useEventListener.js';
import { useChannelInstance } from './useChannelInstance.js';
export function useChannelStateListener(channelNameOrNameAndAblyId, stateOrListener, listener) {
    const channelHookOptions = typeof channelNameOrNameAndAblyId === 'object'
        ? channelNameOrNameAndAblyId
        : { channelName: channelNameOrNameAndAblyId };
    const { ablyId, channelName } = channelHookOptions;
    const { channel } = useChannelInstance(ablyId, channelName);
    const _listener = typeof listener === 'function' ? listener : stateOrListener;
    const state = typeof stateOrListener !== 'function' ? stateOrListener : undefined;
    useEventListener(channel, _listener, state);
}
//# sourceMappingURL=useChannelStateListener.js.map