import { FeedPayload } from '../types/FeedPayload';

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

export const addFeedPriceMsg = (feedPayload: FeedPayload) => {
    return {
        feed_prices: {
            prices: [
                {
                    base: feedPayload.price,
                    values: [[feedPayload.baseAsset, feedPayload.price]],
                },
            ],
        },
    };
};

export const updateSupportedPairsMsg = (pairs: [string[]]) => {
    return {
        supported_denom_pairs: { pairs: pairs },
    };
};
