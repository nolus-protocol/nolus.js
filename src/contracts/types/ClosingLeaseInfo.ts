import { Asset } from './Asset';

export interface ClosingLeaseInfo {
    amount: Asset;
    in_progress?: string;
}
