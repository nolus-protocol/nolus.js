import { Liability } from './Liability';
import { Repayment } from './Repayment';

export interface LeaserConfigInfo {
    owner?: string;
    lease_code_id?: string;
    lpp_addr?: number;
    lease_interest_rate_margin: number;
    liability: Liability;
    repayment: Repayment;
    time_alarms: string;
    market_price_oracle: string;
    profit: string;
}
