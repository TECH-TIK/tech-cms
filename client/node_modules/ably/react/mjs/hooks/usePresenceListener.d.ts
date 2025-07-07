import type * as Ably from 'ably';
import { ChannelParameters } from '../AblyReactHooks.js';
interface PresenceMessage<T = any> extends Ably.PresenceMessage {
    data: T;
}
export interface PresenceListenerResult<T> {
    presenceData: PresenceMessage<T>[];
    connectionError: Ably.ErrorInfo | null;
    channelError: Ably.ErrorInfo | null;
}
export type OnPresenceMessageReceived<T> = (presenceData: PresenceMessage<T>) => void;
export declare function usePresenceListener<T = any>(channelNameOrNameAndOptions: ChannelParameters, onPresenceMessageReceived?: OnPresenceMessageReceived<T>): PresenceListenerResult<T>;
export {};
