import { Asset } from './Asset';

export interface LeaseStatus {
    amount: Asset;
    annual_interest: number;
    principal_due: Asset;
    interest_due: Asset;
}
