import { FeedPrices } from '../types/FeedPrices';
import { OraclePriceConfig } from '../types/OraclePriceConfig';
import { Tree } from '../types/SwapTree';

export const getPriceForMsg = (denom: string) => {
    return {
        price: {
            currency: denom,
        },
    };
};

export const getPricesForMsg = (denoms: string[]) => {
    return {
        prices: {
            currencies: denoms,
        },
    };
};

export const getCurrencyPairsMsg = () => {
    return {
        supported_currency_pairs: {},
    };
};

export const addFeederMsg = (feederWalletAddress: string) => {
    return {
        register_feeder: {
            feeder_address: feederWalletAddress,
        },
    };
};

export const removeFeederMsg = (feederWalletAddress: string) => {
    return {
        remove_feeder: {
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

export const feedPricesMsg = (feedPrices: FeedPrices) => {
    return {
        feed_prices: feedPrices,
    };
};

export const updateSwapTreeMsg = (swapTree: Tree) => {
    return {
        swap_tree: {
            tree: swapTree,
        },
    };
};

export const getConfigMsg = () => {
    return {
        config: {},
    };
};

export const updateConfigMsg = (priceConfig: OraclePriceConfig) => {
    return {
        update_config: priceConfig,
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
