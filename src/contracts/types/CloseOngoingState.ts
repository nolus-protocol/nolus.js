import { Asset } from './Asset';

export interface CloseOngoingState {
    close: {
        close: Asset;
        in_progress: string;
    };
}
