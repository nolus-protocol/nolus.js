import { Asset } from './Asset';

export interface LeaseApply {
    total: Asset;
    borrow: Asset;
    annual_interest_rate: string;
}
