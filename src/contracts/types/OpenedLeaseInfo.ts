import { Asset } from './Asset';
import { LiquidationOngoingState } from './LiquidationOngoingState';
import { RepaymentOngoingState } from './RepaymentOngoingState';

export interface OpenedLeaseInfo {
    amount: Asset;
    interest_rate: number;
    interest_rate_margin: number;
    principal_due: Asset;
    previous_margin_due: Asset;
    previous_interest_due: Asset;
    current_margin_due: Asset;
    current_interest_due: Asset;
    validity: string;
    in_progress?: RepaymentOngoingState | LiquidationOngoingState;
}
