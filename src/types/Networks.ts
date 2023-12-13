export interface Networks {
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
                network: string;
                ch: string;
            };
            b: {
                network: string;
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
    ibc_route: string[];
    ticker: string;
    native: boolean;
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

export enum Protocols {
    osmosis = 'OSMOSIS',
    neutron = 'NEUTRON',
}