import * as Ably from 'ably';
type EventListener<T> = (stateChange: T) => any;
export declare function useEventListener<S extends Ably.ConnectionState | Ably.ChannelState, C extends Ably.ConnectionStateChange | Ably.ChannelStateChange>(emitter: Ably.EventEmitter<EventListener<C>, C, S>, listener: EventListener<C>, event?: S | S[]): void;
export {};
