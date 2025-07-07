import type * as Ably from 'ably';
import { ChannelParameters } from '../AblyReactHooks.js';
export interface PresenceResult<T> {
    updateStatus: (messageOrPresenceObject: T) => Promise<void>;
    connectionError: Ably.ErrorInfo | null;
    channelError: Ably.ErrorInfo | null;
}
export declare function usePresence<T = any>(channelNameOrNameAndOptions: ChannelParameters, messageOrPresenceObject?: T): PresenceResult<T>;
