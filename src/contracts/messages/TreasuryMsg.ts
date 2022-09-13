import { Asset } from '../types';

export const configRewardsTransferMsg = (address: string) => {
    return {
        configure_reward_transfer: {
            rewards_dispatcher: address,
        },
    };
};

export const sendRewardsMsg = (rewards: Asset) => {
    return {
        send_rewards: {
            amount: rewards,
        },
    };
};
