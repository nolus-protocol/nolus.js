/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';

// @ts-ignore
import CURRENCIES_DEVNET from './currencies_devnet.json';
// @ts-ignore
import CURRENCIES_TESTNET from './currencies_testnet.json';
// @ts-ignore
import CURRENCIES_MAINNET from './currencies_mainnet.json';

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
    public static getCurrenciesByGroup(group: string, currenciesData: any): string[] {
        let currenciesByGroup: string[] = [];
        const subArr: string[][] = [];
        const groupsData = currenciesData.lease;
        const groups = Object.keys(groupsData);

        if (group.toLowerCase() === 'native') {
            currenciesByGroup.push(groupsData.Native.id);
        } else if (group.toLowerCase() === 'payment') {
            groups.forEach((group) => {
                if (group.toLowerCase() === 'native') {
                    subArr.push([groupsData.Native.id]);
                } else {
                    subArr.push(Object.keys(groupsData[group as keyof typeof groupsData]));
                }
            });
            currenciesByGroup = subArr.flat();
        } else if (groups.indexOf(group) > -1) {
            const groupData = groupsData[group as keyof typeof groupsData];
            currenciesByGroup = Object.keys(groupData);
        }
        return currenciesByGroup;
    }

    public static getCurrenciesByGroupTestnet(group: string): string[] {
        const currenciesData = CURRENCIES_TESTNET;

        return this.getCurrenciesByGroup(group, currenciesData);
    }

    public static getCurrenciesByGroupMainnet(group: string): string[] {
        const currenciesData = CURRENCIES_MAINNET;

        return this.getCurrenciesByGroup(group, currenciesData);
    }

    public static getCurrenciesByGroupDevnet(group: string): string[] {
        const currenciesData = CURRENCIES_DEVNET;

        return this.getCurrenciesByGroup(group, currenciesData);
    }

    /**
     * The current method converts 'ticker' to ibc/ denom.
     *
     * "The currency symbol at Nolus network is either equal to the currency 'symbol' if its 'ibc_route' == [], or ",
     * "'ibc/' + sha256('transfer' + '/' + ibc_route[0] + '/' + ... + 'transfer' + '/' + ibc_route[n-1] + '/' + symbol) otherwise."
     */
    public static makeIBCMinimalDenom(ticker: string, currenciesData: any): string {
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

    public static makeIBCMinimalDenomDevnet(ticker: string): string {
        const currenciesData = CURRENCIES_DEVNET.currencies;

        return this.makeIBCMinimalDenom(ticker, currenciesData);
    }

    public static makeIBCMinimalDenomTestnet(ticker: string): string {
        const currenciesData = CURRENCIES_TESTNET.currencies;

        return this.makeIBCMinimalDenom(ticker, currenciesData);
    }

    public static makeIBCMinimalDenomMainnet(ticker: string): string {
        const currenciesData = CURRENCIES_MAINNET.currencies;

        return this.makeIBCMinimalDenom(ticker, currenciesData);
    }
}
