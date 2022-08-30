import { Asset } from './Asset';

export interface Denom {
    base: Asset;
    quote: Asset;
}

export interface Prices {
    prices: Denom[];
}
