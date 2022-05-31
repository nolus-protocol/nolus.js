import { Asset } from './Asset';

export interface LeaseApply {
    total: Asset;
    borrow: Asset;
    annualInterestRate: string;
}
