import { LeasePositionSpec } from './LeasePositionSpec';
import { Repayment } from './Repayment';
import { DEX } from './DEX';

export interface LeaserConfigInfo {
    lease_interest_rate_margin: number;
    lease_interest_payment: Repayment;
    lease_position_spec: LeasePositionSpec;
    lease_code_id?: string;
    time_alarms?: string;
    market_price_oracle?: string;
    profit?: string;
    lpp_addr?: number;
    dex?: DEX;
}
