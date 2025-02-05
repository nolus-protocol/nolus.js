import { Asset } from '../types';

export const getLeaseStatusMsg = (due_projection_secs?: number) => {
    if (typeof due_projection_secs === 'undefined') {
        return {};
    }
    return {
        due_projection_secs: due_projection_secs,
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

export const closePositionLeaseMsg = (amount?: Asset) => {
    if (typeof amount === 'undefined') {
        return {
            close_position: {
                full_close: {},
            },
        };
    }
    return {
        close_position: {
            partial_close: {
                amount: amount,
            },
        },
    };
};

export const changeClosePolicyMsg = (stopLoss?: number | null, takeProfit?: number | null) => {
    return {
        change_close_policy: {
            ...(stopLoss === null ? { stop_loss: 'reset' } : stopLoss !== undefined ? { stop_loss: { set: stopLoss } } : {}),
            ...(takeProfit === null ? { take_profit: 'reset' } : takeProfit !== undefined ? { take_profit: { set: takeProfit } } : {}),
        },
    };
};
