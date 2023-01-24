import { Asset } from './Asset';

export interface RepaymentOngoingState {
    repayment: {
        payment: Asset;
        in_progress: string;
    };
}
