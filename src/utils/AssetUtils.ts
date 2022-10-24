import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';
import { execSync } from 'child_process';

export class AssetUtils {
    public static makeIBCMinimalDenom(accessToken: string, ticker: string): string {
        const currenciesFilePath = 'https://gitlab-nomo.credissimo.net/api/v4/projects/15/repository/files/testnet-rila%2Fcurrencies%2Ejson/raw?ref=main';
        const curlCommand = 'curl ' + currenciesFilePath + " -H 'PRIVATE-TOKEN: " + accessToken + "'";
        const response = execSync(curlCommand).toString();

        const currencyData = JSON.parse(response).currencies[ticker.toString()];
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
