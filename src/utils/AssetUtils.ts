import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import CURRENCIES from './currencies.json';

/**
 * AssetUtils provides helpers for working with Nolus assets.
 *
 * Тhe Nolus protocol works with a certain set of currencies called 'supported currencies':
 * - Тhe Nolus protocol recognizes them by their 'ticker' (e.g. 'OSMO', 'NLS', 'USDC' etc.).
 * - Тhe bank module recognizes them by their calculated ibc/ denom.
 */
export class AssetUtils {
    /**
     * The supported currencies are organized into several groups - Lpn, Lease, Payment.
     * The following rules apply here:
     * - "Lpn contains the Lpp currencies.",
     * - "Lease currencies are the ones customers may open lease in.",
     * - "Payment defines the currencies customers may repay their leases in.",
     * - "All members of Lpn are members of Payments.",
     * - "All members of Lease are members of Payments.",
     * - "Lpn and Lease groups do not intersect."
     *
     *  The current method returns a list of tickers by group.
     */
    public static getCurrenciesByGroup(group: string): string[] {
        const currenciesData = CURRENCIES.currencies;
        const currenciesByGroup: string[] = [];
        Object.keys(currenciesData).forEach((key) => {
            const currencyObj = currenciesData[key as keyof typeof currenciesData];
            if (currencyObj.groups.indexOf(group) > -1 || (group === 'Payment' && (currencyObj.groups.indexOf('Lpn') > -1 || currencyObj.groups.indexOf('Lease') > -1))) currenciesByGroup.push(key);
        });
        return currenciesByGroup;
    }

    /**
     * The current method converts 'ticker' to ibc/ denom.
     *
     * "The currency symbol at Nolus network is either equal to the currency 'symbol' if its 'ibc_route' == [], or ",
     * "'ibc/' + sha256('transfer' + '/' + ibc_route[0] + '/' + ... + 'transfer' + '/' + ibc_route[n-1] + '/' + symbol) otherwise."
     */
    public static makeIBCMinimalDenom(ticker: string): string {
        const currenciesData = CURRENCIES.currencies;
        const currencyData = currenciesData[ticker as keyof typeof currenciesData];
        if (currencyData === undefined) {
            return 'Ticker was not found in the list.';
        }
        const currencyIBCroutes = currencyData.ibc_route;
        const currencySymbol = currencyData.symbol;

        if (currencyIBCroutes.length === 0) return currencySymbol;

        let stringToConvert = '';
        currencyIBCroutes.forEach((IBCroute: string) => {
            stringToConvert += 'transfer/' + IBCroute + '/';
        });
        stringToConvert += currencySymbol;

        return (
            'ibc/' +
            Buffer.from(Hash.sha256(Buffer.from(stringToConvert)))
                .toString('hex')
                .toUpperCase()
        );
    }
}
