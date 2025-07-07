import { ErrorInfo } from 'ably';
import { ChannelNameAndOptions } from '../AblyReactHooks.js';
export declare function useStateErrors(params: ChannelNameAndOptions): {
    connectionError: ErrorInfo;
    channelError: ErrorInfo;
};
