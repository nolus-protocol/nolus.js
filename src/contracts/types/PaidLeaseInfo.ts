import { Asset } from './Asset';

export interface PaidLeaseInfo {
    amount: Asset;
    in_progress?: string;
}
