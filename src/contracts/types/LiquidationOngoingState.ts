import { Asset } from './Asset';

export interface LiquidationOngoingState {
    liquidation: {
        amount_out: Asset;
        in_progress: string;
    };
}
