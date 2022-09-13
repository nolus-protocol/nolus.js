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

export const getOutstandingInterestMsg = (leaseAddress: string, outstandingTime: string) => {
    return {
        loan_outstanding_interest: {
            lease_addr: leaseAddress,
            outstanding_time: outstandingTime,
        },
    };
};

export const getPriceMsg = () => {
    return {
        price: [],
    };
};

export const getLenderRewardsMsg = (address: string) => {
    return {
        rewards: {
            address: address,
        },
    };
};

export const claimRewardsMsg = (address?: string) => {
    return {
        claim_rewards: {
            other_recipient: address,
        },
    };
};

export const getLenderDepositMsg = (address: string) => {
    return {
        balance: {
            address: address,
        },
    };
};

export const depositMsg = () => {
    return {
        deposit: [],
    };
};

export const distributeRewardsMsg = () => {
    return {
        distribute_rewards: [],
    };
};

export const burnMsg = (burnAmount: string) => {
    return {
        burn: {
            amount: burnAmount,
        },
    };
};