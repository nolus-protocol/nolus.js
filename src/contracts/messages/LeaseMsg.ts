export const makeLeaseApply = (amount: string, denom: string) => {
    return {
        quote: {
            downpayment: {
                denom: denom,
                amount: amount,
            },
        },
    };
};

export const openLease = (denom: string) => {
    return {
        open_lease: {
            currency: denom,
        },
    };
};

export const getCurrentOpenLeases = (address: string) => {
    return {
        leases: {
            owner: address,
        },
    };
};

export const getLeaseStatus = () => {
    return {
        status_query: {},
    };
};

export const repayLease = () => {
    return {
        repay: {},
    };
};
