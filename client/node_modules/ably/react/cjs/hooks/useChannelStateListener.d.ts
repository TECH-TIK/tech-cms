import * as Ably from 'ably';
import { ChannelNameAndAblyId } from '../AblyReactHooks.js';
type ChannelStateListener = (stateChange: Ably.ChannelStateChange) => any;
export declare function useChannelStateListener(channelName: string, listener?: ChannelStateListener): any;
export declare function useChannelStateListener(options: ChannelNameAndAblyId, listener?: ChannelStateListener): any;
export declare function useChannelStateListener(options: ChannelNameAndAblyId | string, state?: Ably.ChannelState | Ably.ChannelState[], listener?: ChannelStateListener): any;
export {};
