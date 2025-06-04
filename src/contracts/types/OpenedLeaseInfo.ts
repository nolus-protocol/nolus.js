import { Asset } from './Asset';
import { ClosePolicyState } from './ClosePolicyState';
import { OpenedOngoingState } from './OpenedOngoingState';

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
    status?: OpenedOngoingState | string;
}
