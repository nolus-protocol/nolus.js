import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';
import { execSync } from 'child_process';

export class AssetUtils {
    public static makeIBCMinimalDenom(accessToken: string, ticker: string): string {
        const currenciesFilePath = 'https://gitlab-nomo.credissimo.net/api/v4/projects/15/repository/files/testnet-rila%2Fcurrencies%2Ejson/raw?ref=main';
        const curlCommand = 'curl ' + currenciesFilePath + " -H 'PRIVATE-TOKEN: " + accessToken + "'";
        const response = execSync(curlCommand).toString();

        const currencyData = JSON.parse(response).currencies[ticker.toString()];
        const currencyIBCroutes = currencyData.ibc_route;
        const currencySymbol = currencyData.symbol;

        let stringToConvert = 'transfer/';
        currencyIBCroutes.forEach((IBCroute: string) => {
            stringToConvert += IBCroute + '/transfer/';
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
