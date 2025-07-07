"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const AblyContext_js_1 = require("./AblyContext.js");
const AblyReactHooks_js_1 = require("./AblyReactHooks.js");
const ChannelProvider = ({ ablyId = 'default', channelName, options, deriveOptions, children, }) => {
    const context = react_1.default.useContext(AblyContext_js_1.AblyContext);
    const { client, _channelNameToChannelContext } = context[ablyId];
    if (_channelNameToChannelContext[channelName]) {
        throw new Error('You can not use more than one `ChannelProvider` with the same channel name');
    }
    const derived = Boolean(deriveOptions);
    const channel = derived ? client.channels.getDerived(channelName, deriveOptions) : client.channels.get(channelName);
    const value = (0, react_1.useMemo)(() => {
        return Object.assign(Object.assign({}, context), { [ablyId]: {
                client,
                _channelNameToChannelContext: Object.assign(Object.assign({}, _channelNameToChannelContext), { [channelName]: {
                        channel,
                        derived,
                    } }),
            } });
    }, [derived, client, channel, channelName, _channelNameToChannelContext, ablyId, context]);
    (0, react_1.useLayoutEffect)(() => {
        channel.setOptions((0, AblyReactHooks_js_1.channelOptionsForReactHooks)(options));
    }, [channel, options]);
    return (0, jsx_runtime_1.jsx)(AblyContext_js_1.AblyContext.Provider, Object.assign({ value: value }, { children: children }));
};
exports.ChannelProvider = ChannelProvider;
//# sourceMappingURL=ChannelProvider.js.map