export interface LppConfig {
    lpn_ticker: string;
    lease_code: number;
    min_utilization: number;
    borrow_rate: {
        base_interest_rate: number;
        utilization_optimal: number;
        addon_optimal_interest_rate: number;
    };
}
