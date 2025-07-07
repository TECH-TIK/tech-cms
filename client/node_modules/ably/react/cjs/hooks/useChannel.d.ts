import * as Ably from 'ably';
import { ChannelParameters } from '../AblyReactHooks.js';
export type AblyMessageCallback = Ably.messageCallback<Ably.Message>;
export interface ChannelResult {
    channel: Ably.RealtimeChannel;
    publish: Ably.RealtimeChannel['publish'];
    ably: Ably.RealtimeClient;
    connectionError: Ably.ErrorInfo | null;
    channelError: Ably.ErrorInfo | null;
}
export declare function useChannel(channelNameOrNameAndOptions: ChannelParameters, callbackOnMessage?: AblyMessageCallback): ChannelResult;
export declare function useChannel(channelNameOrNameAndOptions: ChannelParameters, event: string, callbackOnMessage?: AblyMessageCallback): ChannelResult;
