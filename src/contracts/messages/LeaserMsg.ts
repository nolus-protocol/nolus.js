import { LeaserConfig } from '../types';

export const leaseQuoteMsg = (amount: string, symbol: string) => {
    return {
        quote: {
            downpayment: {
                symbol: symbol,
                amount: amount,
            },
        },
    };
};

export const getCurrentOpenLeasesByOwnerMsg = (address: string) => {
    return {
        leases: {
            owner: address,
        },
    };
};

export const getLeaserConfigMsg = () => {
    return {
        config: {},
    };
};

export const openLeaseMsg = (denom: string) => {
    return {
        open_lease: {
            currency: denom,
        },
    };
};

export const setLeaserConfigMsg = (leaserConfig: LeaserConfig) => {
    return leaserConfig;
};
