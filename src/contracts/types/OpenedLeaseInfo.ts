import { Asset } from './Asset';
import { CloseOngoingState } from './CloseOngoingState';
import { LiquidationOngoingState } from './LiquidationOngoingState';
import { RepaymentOngoingState } from './RepaymentOngoingState';
import { ClosePolicyState } from './ClosePolicyState';

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
    overdue_collect_in: bigint;
    close_policy: ClosePolicyState;
    in_progress?: RepaymentOngoingState | LiquidationOngoingState | CloseOngoingState;
}
