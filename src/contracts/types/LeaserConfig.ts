import { Liability } from './Liability';
import { Repayment } from './Repayment';

export interface LeaserConfig {
    owner?: string;
    lease_code_id?: string;
    lpp_ust_addr?: number;
    recalc_hours?: number;
    lease_interest_rate_margin: number;
    liability: Liability;
    repayment: Repayment;
}
