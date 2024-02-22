import { LeasePositionSpec } from './LeasePositionSpec';
import { DEX } from './DEX';

export interface LeaserConfigInfo {
    lease_interest_rate_margin: number;
    lease_due_period: bigint;
    lease_position_spec: LeasePositionSpec;
    lease_code_id?: string;
    time_alarms?: string;
    market_price_oracle?: string;
    profit?: string;
    lpp?: string;
    dex?: DEX;
}
