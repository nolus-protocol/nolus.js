import { Liability } from '../types/Liability';
import { Repayment } from '../types/Repayment';
import { LeaserConfig } from '../types/LeaserConfig';

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
        repay: {},
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
