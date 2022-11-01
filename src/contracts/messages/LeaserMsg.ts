import { LeaserConfig } from '../types';

export const leaseQuoteMsg = (downpaymentAmount: string, downpaymentCurrency: string, leaseAsset: string) => {
    return {
        quote: {
            lease_asset: leaseAsset,
            downpayment: {
                ticker: downpaymentCurrency,
                amount: downpaymentAmount,
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
