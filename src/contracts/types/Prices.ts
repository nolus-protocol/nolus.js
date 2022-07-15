export interface Denom {
    denom: string;
    price: {
        amount: string;
        denom: string;
    };
}

export interface Prices {
    prices: Denom[];
}
