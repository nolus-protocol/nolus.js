import { Asset } from './Asset';

export interface LiquidationOngoingState {
    liquidation: {
        liquidation: Asset;
        cause: string;
        in_progress: string;
    };
}
