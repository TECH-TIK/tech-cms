import * as Ably from 'ably';
import React from 'react';
export type AblyContextValue = Record<string, AblyContextProviderProps>;
export interface AblyContextProviderProps {
    client: Ably.RealtimeClient;
    _channelNameToChannelContext: Record<string, ChannelContextProps>;
}
export interface ChannelContextProps {
    channel: Ably.RealtimeChannel;
    derived?: boolean;
}
export declare const AblyContext: React.Context<AblyContextValue>;
