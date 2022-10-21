import { LeaserConfig } from '../types';

export const leaseQuoteMsg = (downpaymentAmount: string, downpaymentCurrency: string) => {
    return {
        quote: {
            downpayment: {
                ticker: downpaymentAmount,
                amount: downpaymentCurrency,
            },
        },
    };
};

export const getCurrentOpenLeasesByOwnerMsg = (ownerAddress: string) => {
    return {
        leases: {
            owner: ownerAddress,
        },
    };
};

export const getLeaserConfigMsg = () => {
    return {
        config: {},
    };
};

export const openLeaseMsg = (leaseCurrency: string) => {
    return {
        open_lease: {
            currency: leaseCurrency,
        },
    };
};

export const setLeaserConfigMsg = (leaserConfig: LeaserConfig) => {
    return leaserConfig;
};
