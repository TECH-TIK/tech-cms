import * as Ably from 'ably';
type ConnectionStateListener = (stateChange: Ably.ConnectionStateChange) => any;
export declare function useConnectionStateListener(listener: ConnectionStateListener, ablyId?: string): any;
export declare function useConnectionStateListener(state: Ably.ConnectionState | Ably.ConnectionState[], listener: ConnectionStateListener, ablyId?: string): any;
export {};
