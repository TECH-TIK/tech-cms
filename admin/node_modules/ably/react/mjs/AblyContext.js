import React from 'react';
// We need to make sure we never create more than one Ably React context.
// This might happen when exporting a context directly from a module -
// there's a risk of creating multiple instances of the same context
// if there are misconfigurations in module bundler or package manager on the consumer side of Ably Context.
// This can lead to problems like having an Ably Channel instance added
// in one context, and then attempting to retrieve it from another different context.
// This is why a single Ably context is created and stored in the global state.
const contextKey = Symbol.for('__ABLY_CONTEXT__');
const globalObjectForContext = typeof globalThis !== 'undefined' ? globalThis : {};
function getContext() {
    let context = globalObjectForContext[contextKey];
    if (!context) {
        context = globalObjectForContext[contextKey] = React.createContext({});
    }
    return context;
}
export const AblyContext = getContext();
//# sourceMappingURL=AblyContext.js.map