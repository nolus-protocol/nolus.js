import { OraclePriceConfig } from './OraclePriceConfig';

export interface Config {
    base_asset: string;
    price_config: OraclePriceConfig;
    owner?: string;
}
