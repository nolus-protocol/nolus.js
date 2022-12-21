import { Coin, CoinPretty, Dec, DecUtils, Int, PricePretty } from '@keplr-wallet/unit';
import { Coin as CosmosCoin } from '@cosmjs/proto-signing';
import { ChainConstants } from '../constants';

/**
 * CurrencyUtils provides helpers for working with Nolus currencies. Conversion, formatting and calculation.
 */
export class CurrencyUtils {
    public static convertNolusToUNolus(tokenAmount: string): Coin {
        return this.convertDenomToMinimalDenom(tokenAmount, ChainConstants.COIN_MINIMAL_DENOM, ChainConstants.COIN_DECIMALS);
    }

    public static convertDenomToMinimalDenom(tokenAmount: string, minimalDenom: string, decimals: number): Coin {
        if (tokenAmount.trim() === '') {
            return new Coin(minimalDenom, new Dec('0').truncate());
        }
        const amount = new Dec(tokenAmount).mul(DecUtils.getPrecisionDec(decimals)).truncate();
        const coin = new Coin(minimalDenom, amount);
        return coin;
    }

    public static convertCoinUNolusToNolus(tokenAmount: Coin | null | undefined): CoinPretty | null {
        return this.convertCoinMinimalDenomToDenom(tokenAmount, ChainConstants.COIN_MINIMAL_DENOM, ChainConstants.COIN_DENOM, ChainConstants.COIN_DECIMALS);
    }

    public static convertCoinMinimalDenomToDenom(tokenAmount: Coin | null | undefined, minimalDenom: string, denom: string, decimals: number): CoinPretty | null {
        if (tokenAmount === null || tokenAmount === undefined) {
            return null;
        }
        const amount = new Dec(tokenAmount.amount.toString());
        return new CoinPretty(
            {
                coinDecimals: decimals,
                coinMinimalDenom: minimalDenom,
                coinDenom: denom,
            },
            amount,
        );
    }

    public static convertUNolusToNolus(tokenAmount: string): CoinPretty {
        return this.convertMinimalDenomToDenom(tokenAmount, ChainConstants.COIN_MINIMAL_DENOM, ChainConstants.COIN_DENOM, ChainConstants.COIN_DECIMALS);
    }

    public static convertMinimalDenomToDenom(tokenAmount: string, minimalDenom: string, denom: string, decimals: number): CoinPretty {
        const amount = new Dec(tokenAmount);
        return new CoinPretty(
            {
                coinDecimals: decimals,
                coinMinimalDenom: minimalDenom,
                coinDenom: denom,
            },
            amount,
        );
    }

    public static convertCosmosCoinToKeplCoin(cosmosCoin: CosmosCoin | undefined): Coin {
        if (!cosmosCoin) {
            return new Coin('', 0);
        }
        return new Coin(cosmosCoin.denom, cosmosCoin.amount);
    }

    public static calculateBalance(price: string, tokenAmount: Coin, tokenDecimal: number) {
        const amount = new Dec(tokenAmount.amount).quoTruncate(new Dec(10).pow(new Int(tokenDecimal)));
        return new PricePretty(
            {
                currency: 'usd',
                maxDecimals: 4,
                symbol: '$',
                locale: 'en-US',
            },
            new Dec(price).mul(amount),
        );
    }

    public static formatPrice(price: string) {
        return new PricePretty(
            {
                currency: 'usd',
                maxDecimals: 4,
                symbol: '$',
                locale: 'en-US',
            },
            new Dec(price),
        );
    }
}
