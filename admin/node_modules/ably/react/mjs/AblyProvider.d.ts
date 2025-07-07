import * as Ably from 'ably';
import React from 'react';
interface AblyProviderProps {
    children?: React.ReactNode | React.ReactNode[] | null;
    client?: Ably.RealtimeClient;
    ablyId?: string;
}
export declare const AblyProvider: ({ client, children, ablyId }: AblyProviderProps) => import("react/jsx-runtime").JSX.Element;
export {};
