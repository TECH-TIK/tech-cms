"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePresence = void 0;
const react_1 = require("react");
const useAbly_js_1 = require("./useAbly.js");
const useChannelInstance_js_1 = require("./useChannelInstance.js");
const useStateErrors_js_1 = require("./useStateErrors.js");
const useChannelStateListener_js_1 = require("./useChannelStateListener.js");
const constants_js_1 = require("./constants.js");
const useChannelAttach_js_1 = require("./useChannelAttach.js");
function usePresence(channelNameOrNameAndOptions, messageOrPresenceObject) {
    const params = typeof channelNameOrNameAndOptions === 'object'
        ? channelNameOrNameAndOptions
        : { channelName: channelNameOrNameAndOptions };
    const skip = params.skip;
    const ably = (0, useAbly_js_1.useAbly)(params.ablyId);
    const { channel } = (0, useChannelInstance_js_1.useChannelInstance)(params.ablyId, params.channelName);
    const { connectionError, channelError } = (0, useStateErrors_js_1.useStateErrors)(params);
    // we can't simply add messageOrPresenceObject to dependency list in our useCallback/useEffect hooks,
    // since it will most likely cause an infinite loop of updates in cases when user calls this hook
    // with an object literal instead of a state or memoized object.
    // to prevent this from happening we store messageOrPresenceObject in a ref, and use that instead.
    // note that it still prevents us from automatically re-entering presence with new messageOrPresenceObject if it changes.
    // one of the options to fix this, is to use deep equals to check if the object has actually changed. see https://github.com/ably/ably-js/issues/1688.
    const messageOrPresenceObjectRef = (0, react_1.useRef)(messageOrPresenceObject);
    (0, react_1.useEffect)(() => {
        messageOrPresenceObjectRef.current = messageOrPresenceObject;
    }, [messageOrPresenceObject]);
    // similar to connection states, we should only attempt to enter presence when in certain
    // channel states.
    const [channelState, setChannelState] = (0, react_1.useState)(channel.state);
    (0, useChannelStateListener_js_1.useChannelStateListener)(params, (stateChange) => {
        setChannelState(stateChange.current);
    });
    const { connectionState } = (0, useChannelAttach_js_1.useChannelAttach)(channel, params.ablyId, skip);
    const shouldNotEnterPresence = constants_js_1.INACTIVE_CONNECTION_STATES.includes(connectionState) || constants_js_1.INACTIVE_CHANNEL_STATES.includes(channelState) || skip;
    (0, react_1.useEffect)(() => {
        if (shouldNotEnterPresence) {
            return;
        }
        const onMount = async () => {
            await channel.presence.enter(messageOrPresenceObjectRef.current);
        };
        onMount();
        return () => {
            // here we use the ably.connection.state property, which upon this cleanup function call
            // will have the current connection state for that connection, thanks to us accessing the Ably instance here by reference.
            // if the connection is in one of the inactive states or the channel is not attached/attaching, a presence.leave call will produce an exception.
            // so we should only leave presence in other cases.
            const canLeaveFromConnectionState = !constants_js_1.INACTIVE_CONNECTION_STATES.includes(ably.connection.state);
            const canLeaveFromChannelState = ['attached', 'attaching'].includes(channel.state);
            if (canLeaveFromChannelState && canLeaveFromConnectionState) {
                channel.presence.leave();
            }
        };
    }, [shouldNotEnterPresence, channel, ably]);
    const updateStatus = (0, react_1.useCallback)(async (messageOrPresenceObject) => {
        await channel.presence.update(messageOrPresenceObject);
    }, [channel]);
    return { updateStatus, connectionError, channelError };
}
exports.usePresence = usePresence;
//# sourceMappingURL=usePresence.js.map