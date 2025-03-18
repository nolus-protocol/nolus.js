import { Asset } from './Asset';

export interface CloseOngoingState {
    close: {
        close: Asset;
        type: string;
        in_progress: string;
    };
}
