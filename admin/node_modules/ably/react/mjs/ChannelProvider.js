import { jsx as _jsx } from "react/jsx-runtime";
import React, { useLayoutEffect, useMemo } from 'react';
import { AblyContext } from './AblyContext.js';
import { channelOptionsForReactHooks } from './AblyReactHooks.js';
export const ChannelProvider = ({ ablyId = 'default', channelName, options, deriveOptions, children, }) => {
    const context = React.useContext(AblyContext);
    const { client, _channelNameToChannelContext } = context[ablyId];
    if (_channelNameToChannelContext[channelName]) {
        throw new Error('You can not use more than one `ChannelProvider` with the same channel name');
    }
    const derived = Boolean(deriveOptions);
    const channel = derived ? client.channels.getDerived(channelName, deriveOptions) : client.channels.get(channelName);
    const value = useMemo(() => {
        return Object.assign(Object.assign({}, context), { [ablyId]: {
                client,
                _channelNameToChannelContext: Object.assign(Object.assign({}, _channelNameToChannelContext), { [channelName]: {
                        channel,
                        derived,
                    } }),
            } });
    }, [derived, client, channel, channelName, _channelNameToChannelContext, ablyId, context]);
    useLayoutEffect(() => {
        channel.setOptions(channelOptionsForReactHooks(options));
    }, [channel, options]);
    return _jsx(AblyContext.Provider, Object.assign({ value: value }, { children: children }));
};
//# sourceMappingURL=ChannelProvider.js.map