import { LeasePositionSpec } from './LeasePositionSpec';
import { DEX } from './DEX';
import { MaxSlippage } from './MaxSlippage';

export interface LeaserConfigInfo {
    lease_interest_rate_margin: number;
    lease_due_period: bigint;
    lease_position_spec: LeasePositionSpec;
    lease_max_slippages: MaxSlippage;
    lease_code?: string;
    time_alarms?: string;
    market_price_oracle?: string;
    profit?: string;
    lpp?: string;
    reserve?: string;
    dex?: DEX;
    protocols_registry?: string;
    lease_admin?: string;
}
