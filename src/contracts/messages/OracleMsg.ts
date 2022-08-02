import { FeedPrices } from '../types/FeedPrices';

export const getPrices = (denoms: string[]) => {
    return {
        price_for: {
            denoms: denoms,
        },
    };
};

export const getSupportedPairs = () => {
    return {
        supported_denom_pairs: {},
    };
};

export const addFeederMsg = (feederWalletAddress: string) => {
    return {
        register_feeder: {
            feeder_address: feederWalletAddress,
        },
    };
};

export const getFeedersMsg = () => {
    return {
        feeders: {},
    };
};

export const isFeederMsg = (feederWalletAddress: string) => {
    return {
        is_feeder: {
            address: feederWalletAddress,
        },
    };
};

export const addFeedPriceMsg = (feedPrices: FeedPrices) => {
    return {
        feed_prices: feedPrices,
    };
};

export const updateSupportedPairsMsg = (pairs: string[][]) => {
    return {
        supported_denom_pairs: { pairs: pairs },
    };
};

export const getConfigMsg = () => {
    return {
        config: {},
    };
};

export const getPrice = () => {
    return {
        price: [],
    };
};

export const changeConfigMsg = (priceFeedPeriod: number, feedersPrecentageNeeded: number) => {
    return {
        config: {
            price_feed_period_secs: priceFeedPeriod,
            feeders_percentage_needed: feedersPrecentageNeeded,
        },
    };
};
