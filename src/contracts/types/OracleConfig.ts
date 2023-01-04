import { OraclePriceConfig } from './OraclePriceConfig';

export interface OracleConfig {
    config: {
        base_asset: string;
        price_config: OraclePriceConfig;
    };
    owner: string;
}
