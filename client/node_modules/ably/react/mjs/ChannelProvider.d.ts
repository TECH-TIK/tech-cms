import React from 'react';
import * as Ably from 'ably';
interface ChannelProviderProps {
    ablyId?: string;
    channelName: string;
    options?: Ably.ChannelOptions;
    deriveOptions?: Ably.DeriveOptions;
    children?: React.ReactNode | React.ReactNode[] | null;
}
export declare const ChannelProvider: ({ ablyId, channelName, options, deriveOptions, children, }: ChannelProviderProps) => import("react/jsx-runtime").JSX.Element;
export {};
