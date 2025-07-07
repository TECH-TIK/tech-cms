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
exports.AblyProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const AblyContext_js_1 = require("./AblyContext.js");
const AblyProvider = ({ client, children, ablyId = 'default' }) => {
    if (!client) {
        throw new Error('AblyProvider: the `client` prop is required');
    }
    const context = react_1.default.useContext(AblyContext_js_1.AblyContext);
    const value = (0, react_1.useMemo)(() => {
        return Object.assign(Object.assign({}, context), { [ablyId]: { client, _channelNameToChannelContext: {} } });
    }, [context, client, ablyId]);
    return (0, jsx_runtime_1.jsx)(AblyContext_js_1.AblyContext.Provider, Object.assign({ value: value }, { children: children }));
};
exports.AblyProvider = AblyProvider;
//# sourceMappingURL=AblyProvider.js.map