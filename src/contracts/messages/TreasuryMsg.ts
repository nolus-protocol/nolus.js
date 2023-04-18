import { Asset } from '../types';

export const sendRewardsMsg = (rewards: Asset) => {
    return {
        send_rewards: {
            amount: rewards,
        },
    };
};
