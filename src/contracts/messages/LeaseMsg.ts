import { Asset } from '../types';

export const getLeaseStatusMsg = () => {
    return {};
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
