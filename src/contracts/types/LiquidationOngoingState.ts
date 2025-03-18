import { Asset } from './Asset';

export interface LiquidationOngoingState {
    liquidation: {
        liquidation: Asset;
        cause: string;
        type: string;
        in_progress: string;
    };
}
