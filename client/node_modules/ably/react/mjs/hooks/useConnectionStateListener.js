import { useAbly } from './useAbly.js';
import { useEventListener } from './useEventListener.js';
export function useConnectionStateListener(stateOrListener, listenerOrAblyId, ablyId = 'default') {
    const _ablyId = typeof listenerOrAblyId === 'string' ? listenerOrAblyId : ablyId;
    const ably = useAbly(_ablyId);
    const listener = typeof listenerOrAblyId === 'function' ? listenerOrAblyId : stateOrListener;
    const state = typeof stateOrListener !== 'function' ? stateOrListener : undefined;
    useEventListener(ably.connection, listener, state);
}
//# sourceMappingURL=useConnectionStateListener.js.map