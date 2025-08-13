export const getLppBalanceMsg = () => {
    return {
        lpp_balance: [],
    };
};

export const getStableBalanceMsg = (oracleAddress: string) => {
    return {
        stable_balance: {
            oracle_addr: oracleAddress,
        },
    };
};

export const getDepositCapacityMsg = () => {
    return {
        deposit_capacity: [],
    };
};

export const getLppConfigMsg = () => {
    return {
        config: [],
    };
};

export const getLPNMsg = () => {
    return {
        lpn: [],
    };
};

export const getLoanInformationMsg = (leaseAddress: string) => {
    return {
        loan: {
            lease_addr: leaseAddress,
        },
    };
};

export const getPriceMsg = () => {
    return {
        price: [],
    };
};

export const getLenderRewardsMsg = (lenderAddress: string) => {
    return {
        rewards: {
            address: lenderAddress,
        },
    };
};

export const getLenderDepositMsg = (lenderAddress: string) => {
    return {
        balance: {
            address: lenderAddress,
        },
    };
};

export const claimRewardsMsg = (recipientAddress?: string) => {
    return {
        claim_rewards: {
            other_recipient: recipientAddress,
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
            amount: { amount: burnAmount },
        },
    };
};
