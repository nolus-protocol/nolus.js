import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';
import * as fs from 'fs';
export class AssetUtils {
    public static async makeIBCMinimalDenom(accessToken: string, ticker: string): Promise<string> {
        const filePath = 'currencies.json';
        const currencyData = JSON.parse(fs.readFileSync(filePath).toString()).currencies[ticker.toString()];
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
