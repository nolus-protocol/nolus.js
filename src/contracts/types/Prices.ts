import { Asset } from './Asset';

export interface Denom {
    denom: string;
    price: Asset;
}

export interface Prices {
    prices: Denom[];
}
