import { LeaserConfig } from '../types';

export const makeLeaseApplyMsg = (amount: string, symbol: string) => {
    return {
        quote: {
            downpayment: {
                symbol: symbol,
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

export const getLppConfigMsg = () => {
    return {
        config: [],
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

export const getOutstandingInterestMsg = (leaseAddress: string, outstandingTime: string) => {
    return {
        loan_outstanding_interest: {
            lease_addr: leaseAddress,
            outstanding_time: outstandingTime,
        },
    };
};
