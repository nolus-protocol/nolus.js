import { Asset } from './Asset';

export interface FeedPrice {
    base: string;
    values: Asset[][];
}
