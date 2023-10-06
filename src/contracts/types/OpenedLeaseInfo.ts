import { Asset } from './Asset';
import { CloseOngoingState } from './CloseOngoingState';
import { LiquidationOngoingState } from './LiquidationOngoingState';
import { RepaymentOngoingState } from './RepaymentOngoingState';

export interface OpenedLeaseInfo {
    amount: Asset;
    loan_interest_rate: number;
    margin_interest_rate: number;
    principal_due: Asset;
    previous_margin_due: Asset;
    previous_interest_due: Asset;
    current_margin_due: Asset;
    current_interest_due: Asset;
    validity: string;
    in_progress?: RepaymentOngoingState | LiquidationOngoingState | CloseOngoingState;
}
