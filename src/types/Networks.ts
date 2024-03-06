export interface NetworkData {
    networks: {
        list: {
            [key: string]: {
                currencies: {
                    [key: string]: Currency;
                };
            };
        };
        channels: {
            a: {
                network: Networks;
                ch: string;
            };
            b: {
                network: Networks;
                ch: string;
            };
        }[];
    };
    protocols: {
        [key: string]: {
            DexNetwork: string,
            Lpn: {
                "dex_currency": string;
            };
            Lease: {
                [key: string]: {
                    "dex_currency": string;
                    swap_routes: Array<
                        {
                            pool_id: string;
                            pool_token: string;
                        }[]
                    >;
                };
            };
            Native: {
                "dex_currency": string;
                swap_routes: Array<
                    {
                        pool_id: string;
                        pool_token: string;
                    }[]
                >;
            };
        }
    }
    definitions: string[];
}

export interface ExternalCurrencyType {
    name: string;
    shortName: string;
    symbol: string;
    decimal_digits: string;
    ticker: string;
    native: boolean;
    key: string;
}

export interface NetworksInfo {
    [key: string]: {
        [key: string]: ExternalCurrencyType;
    };
}

export interface Currency {
    native?: {
        name: string;
        ticker: string;
        symbol: string;
        decimal_digits: string;
    };
    ibc?: {
        network: string;
        currency: string;
    };
    icon?: string;
}

export enum GROUPS {
    Lpn = 'lpn',
    Lease = 'lease',
    Native = 'native',
}

export enum ProtocolsPirin {
    osmosis = 'OSMOSIS-OSMOSIS-USDC_AXELAR',
    neutron = 'NEUTRON-ASTROPORT-USDC_AXELAR',
    osmosis_noble = "OSMOSIS-OSMOSIS-USDC_NOBLE",
}

export enum ProtocolsRila {
    osmosis = 'OSMOSIS-OSMOSIS-USDC-1',
    neutron = 'NEUTRON-ASTROPORT-USDC_AXELAR',
    osmosis_noble = "OSMOSIS-OSMOSIS-USDC_NOBLE",
}

export enum Networks {
    NOLUS = 'NOLUS',
    OSMOSIS = 'OSMOSIS',
    AXELAR = 'AXELAR',
    COSMOS_HUB = 'COSMOS_HUB',
    AKASH = 'AKASH',
    JUNO = 'JUNO',
    NEUTRON = 'NEUTRON',
    DYDX = 'DYDX'
}
