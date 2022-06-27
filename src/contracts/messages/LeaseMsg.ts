import { LeaserConfig } from '../types';

export const makeLeaseApplyMsg = (amount: string, denom: string) => {
    return {
        quote: {
            downpayment: {
                denom: denom,
                amount: amount,
            },
        },
    };
};

export const openLeaseMsg = (denom: string) => {
    return {
        open_lease: {
            currency: denom,
        },
    };
};

export const getCurrentOpenLeasesMsg = (address: string) => {
    return {
        leases: {
            owner: address,
        },
    };
};

export const getLeaseStatusMsg = () => {
    return {
        status_query: {},
    };
};

export const repayLeaseMsg = () => {
    return {
        repay: [],
    };
};

export const closeLeaseMsg = () => {
    return {
        close: [],
    };
};

export const getLppBalanceMsg = () => {
    return {
        lpp_balance: [],
    };
};

export const getLoanInformationMsg = (leaseAddress: string) => {
    return {
        loan: {
            lease_addr: leaseAddress,
        },
    };
};

export const getLeaserConfigMsg = () => {
    return {
        config: {},
    };
};

export const setLeaserConfigMsg = (leaserConfig: LeaserConfig) => {
    return leaserConfig;
};
