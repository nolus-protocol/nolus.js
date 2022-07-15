export interface FeedPrice {
    base: string;
    values: {
        amount: string;
        denom: string;
    }[];
}
