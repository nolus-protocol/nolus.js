import { FeedPrices } from '../types/FeedPrices';

export const getPriceForMsg = (denom: string) => {
    return {
        price: {
            currency: denom,
        },
    };
};

export const getPricesMsg = () => {
    return {
        prices: {},
    };
};

export const getCurrencyPairsMsg = () => {
    return {
        supported_currency_pairs: {},
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

export const getConfigMsg = () => {
    return {
        config: {},
    };
};

export const getSwapPathMsg = (fromCurrency: string, toCurrency: string) => {
    return {
        swap_path: {
            from: fromCurrency,
            to: toCurrency,
        },
    };
};

export const getSwapTreeMsg = () => {
    return {
        swap_tree: {},
    };
};

export const feedPricesMsg = (feedPrices: FeedPrices) => {
    return {
        feed_prices: feedPrices,
    };
};
