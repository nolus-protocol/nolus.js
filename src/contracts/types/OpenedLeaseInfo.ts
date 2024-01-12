import { Asset } from './Asset';
import { CloseOngoingState } from './CloseOngoingState';
import { LiquidationOngoingState } from './LiquidationOngoingState';
import { RepaymentOngoingState } from './RepaymentOngoingState';

export interface OpenedLeaseInfo {
    amount: Asset;
    loan_interest_rate: number;
    margin_interest_rate: number;
    principal_due: Asset;
    overdue_margin: Asset;
    overdue_interest: Asset;
    due_margin: Asset;
    due_interest: Asset;
    validity: string;
    in_progress?: RepaymentOngoingState | LiquidationOngoingState | CloseOngoingState;
}
