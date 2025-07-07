"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChannelStateListener = void 0;
const useEventListener_js_1 = require("./useEventListener.js");
const useChannelInstance_js_1 = require("./useChannelInstance.js");
function useChannelStateListener(channelNameOrNameAndAblyId, stateOrListener, listener) {
    const channelHookOptions = typeof channelNameOrNameAndAblyId === 'object'
        ? channelNameOrNameAndAblyId
        : { channelName: channelNameOrNameAndAblyId };
    const { ablyId, channelName } = channelHookOptions;
    const { channel } = (0, useChannelInstance_js_1.useChannelInstance)(ablyId, channelName);
    const _listener = typeof listener === 'function' ? listener : stateOrListener;
    const state = typeof stateOrListener !== 'function' ? stateOrListener : undefined;
    (0, useEventListener_js_1.useEventListener)(channel, _listener, state);
}
exports.useChannelStateListener = useChannelStateListener;
//# sourceMappingURL=useChannelStateListener.js.map