import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import CURRENCIES from './currencies.json';
export class AssetUtils {
    public static getCurrenciesByGroup(group: string): string[] {
        const currenciesData = CURRENCIES.currencies;
        const currenciesByGroup: string[] = [];
        Object.keys(currenciesData).forEach((key) => {
            const currencyObj = currenciesData[key as keyof typeof currenciesData];
            if (currencyObj.groups.indexOf(group) > -1) currenciesByGroup.push(key);
        });
        return currenciesByGroup;
    }

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
