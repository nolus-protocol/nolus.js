export interface OraclePriceConfig {
    price_feed_period: number;
    min_feeders: number;
    discount_factor: number;
    feed_validity: number;
    sample_period: number;
    samples_number: number;
}
