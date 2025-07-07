import { jsx as _jsx } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { AblyContext } from './AblyContext.js';
export const AblyProvider = ({ client, children, ablyId = 'default' }) => {
    if (!client) {
        throw new Error('AblyProvider: the `client` prop is required');
    }
    const context = React.useContext(AblyContext);
    const value = useMemo(() => {
        return Object.assign(Object.assign({}, context), { [ablyId]: { client, _channelNameToChannelContext: {} } });
    }, [context, client, ablyId]);
    return _jsx(AblyContext.Provider, Object.assign({ value: value }, { children: children }));
};
//# sourceMappingURL=AblyProvider.js.map