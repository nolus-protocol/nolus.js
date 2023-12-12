import { Asset } from './Asset';

export interface LoanInfo {
    principal_due: Asset;
    annual_interest_rate: number;
    interest_paid: number;
}
