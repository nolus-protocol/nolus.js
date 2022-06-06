import { Liability } from './Liability';
import { Repayment } from './Repayment';

export interface LeaserConfig {
    lease_interest_rate_margin: number;
    liability: Liability;
    repayment: Repayment;
}
