/* eslint-disable @typescript-eslint/ban-ts-comment */
import { CurrencyInfo } from '../contracts/types/CurrencyInfo';

/**
 * AssetUtils provides helpers for working with Nolus assets.
 *
 * Тhe Nolus protocol works with a certain set of currencies called 'supported currencies':
 * - Тhe Nolus protocol recognizes them by their 'ticker' (e.g. 'OSMO', 'NLS', 'USDC' etc.).
 * - Тhe bank module recognizes them by their calculated ibc/ denom.
 */
export class AssetUtils {
    /**
     * The supported currencies are organized into several groups - Lpn, Lease, Native.
     * The following rules apply here:
     * - "Lpn contains the Lpp currencies.",
     * - "Lease currencies are the ones customers may open lease in.",
     * - "Native defines the native currency for the Nolus AMM protocol.",
     * - "Leases may be paid with any of the provided currencies.",
     *
     *  The current method returns a list of tickers by group.
     */
    public static findTickersByGroup(currenciesInfo: CurrencyInfo[], group: string): string[] {
        const tickers: string[] = [];

        currenciesInfo.forEach((currencyInfo) => {
            if (currencyInfo.group === group) {
                tickers.push(currencyInfo.ticker);
            }
        });

        return tickers;
    }

    public static findDexSymbolByTicker(currenciesInfo: CurrencyInfo[], ticker: string): string | null {
        const currencyInfo = currenciesInfo.find((currencyInfo) => currencyInfo.ticker === ticker);

        return currencyInfo ? currencyInfo.dex_symbol : null;
    }

    public static findBankSymbolByTicker(currenciesInfo: CurrencyInfo[], ticker: string): string | null {
        const currencyInfo = currenciesInfo.find((currencyInfo) => currencyInfo.ticker === ticker);

        return currencyInfo ? currencyInfo.bank_symbol : null;
    }
}
