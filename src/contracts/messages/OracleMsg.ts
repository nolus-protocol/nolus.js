import { FeedPrices } from '../types/FeedPrices';

export const getBaseCurrencyMsg = () => {
    return {
        base_currency: {},
    };
};

export const getStableCurrencyMsg = () => {
    return {
        stable_currency: {},
    };
};

export const getBasePriceMsg = (ticker: string) => {
    return {
        base_price: {
            currency: ticker,
        },
    };
};

export const getStablePriceMsg = (ticker: string) => {
    return {
        stable_price: {
            currency: ticker,
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

export const getCurrenciesMsg = () => {
    return {
        currencies: {},
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

export const getSwapPathMsg = (fromCurrencyTicker: string, toCurrencyTicker: string) => {
    return {
        swap_path: {
            from: fromCurrencyTicker,
            to: toCurrencyTicker,
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
