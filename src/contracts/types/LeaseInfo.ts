import { Asset } from './Asset';

export interface LeaseInfo {
    amount: Asset;
    interest_rate: number;
    principal_due: Asset;
    interest_due: Asset;
}
