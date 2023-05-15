export const leaseQuoteMsg = (downpaymentAmount: string, downpaymentCurrency: string, leaseAsset: string, max_ltd?: number) => {
    if (typeof max_ltd === 'undefined')
        return {
            quote: {
                lease_asset: leaseAsset,
                downpayment: {
                    ticker: downpaymentCurrency,
                    amount: downpaymentAmount,
                },
            },
        };
    return {
        quote: {
            lease_asset: leaseAsset,
            downpayment: {
                ticker: downpaymentCurrency,
                amount: downpaymentAmount,
            },
            max_ltd: max_ltd,
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

export const openLeaseMsg = (leaseCurrency: string, max_ltd?: number) => {
    if (typeof max_ltd === 'undefined')
        return {
            open_lease: {
                currency: leaseCurrency,
            },
        };

    return {
        open_lease: {
            currency: leaseCurrency,
            max_ltd: max_ltd,
        },
    };
};
