/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Buffer } from 'buffer';
import { Hash } from '@keplr-wallet/crypto';
import { Currency, GROUPS, NetworkData, Networks } from '../types/Networks';
import { ChainConstants } from '../constants';

// @ts-ignore
import CURRENCIES_DEVNET from './currencies_devnet.json';
// @ts-ignore
import CURRENCIES_TESTNET from './currencies_testnet.json';
// @ts-ignore
import CURRENCIES_MAINNET from './currencies_mainnet.json';
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

    /**
     * The current method converts 'ticker' to ibc/ denom.
     *
     * "The currency symbol at Nolus network is either equal to the currency 'symbol' if its 'ibc_route' == [], or ",
     * "'ibc/' + sha256('transfer' + '/' + ibc_route[0] + '/' + ... + 'transfer' + '/' + ibc_route[n-1] + '/' + symbol) otherwise."
     */
    public static makeIBCMinimalDenom(ticker: string, currenciesData: NetworkData, network: Networks, protocol: string): string {
        const currency = currenciesData.networks.list[network].currencies[ticker];

        if (currency?.native) {
            return currency?.native.symbol;
        }

        const channels = AssetUtils.getChannels(currenciesData, ticker, network, protocol, []);
        let path = channels.routes.reduce((a, b) => {
            a += `transfer/${b}/`;
            return a;
        }, '');

        path += `${channels.symbol}`;

        return (
            'ibc/' +
            Buffer.from(Hash.sha256(Buffer.from(path)))
                .toString('hex')
                .toUpperCase()
        );
    }

    public static getChannel(
        channels: {
            a: {
                network: Networks;
                ch: string;
            };
            b: {
                network: Networks;
                ch: string;
            };
        }[],
        ibc: {
            network: Networks | string;
            currency: string;
        },
        network: Networks
    ) {
        const channel = channels.find((item) => {
            return (item.a.network === network && item.b.network === ibc?.network) || (item.a.network === ibc?.network && item.b.network === network);
        });

        if (channel) {
            const { a, b } = channel;
            if (a.network === network) {
                return a;
            }

            if (b.network === network) {
                return b;
            }
        }

        throw 'Channel not found';
    }

    public static getSourceChannel(
        channels: {
            a: {
                network: Networks;
                ch: string;
            };
            b: {
                network: Networks;
                ch: string;
            };
        }[],
        a: string,
        source: string,
    ) {
        const channel = channels.find((item) => {
            return (item.a.network === a && item.b.network === source) || (item.a.network === source && item.b.network === a);
        });

        if (channel) {
            if (channel.a.network === source) {
                return channel.a.ch;
            }

            if (channel.b.network === source) {
                return channel.b.ch;
            }
        }

        throw `Source channel ${source} ${a} not found`;
    }

    public static getChannels(ntwrks: NetworkData, key: string, network: Networks, protocol: string, routes: string[]): { routes: string[], symbol: string } {
        let asset = ntwrks.networks.list[network].currencies[key];

        if(asset == null){
            asset = {
                ibc: {
                    "network": protocol,
                    "currency": key
                }
            }
        }

        if (asset?.ibc) {
            const channel = AssetUtils.getChannel(ntwrks.networks.channels, asset.ibc, network);
            routes.push(channel?.ch as string);

            return AssetUtils.getChannels(ntwrks, asset.ibc?.currency as string, asset.ibc?.network as Networks, protocol, routes);
        }

        return { routes, symbol: asset?.native?.symbol as string };
    }

    public static getAsset(ntwrks: NetworkData, key: string, network: string, protocol: string): { asset: Currency; key: string } {
        const asset = ntwrks.networks.list[network].currencies[key];
        if (asset?.ibc) {
            return AssetUtils.getAsset(ntwrks, asset.ibc?.currency as string, asset.ibc?.network as string, protocol);
        }

        return { asset, key };
    }

    public static getNativeAsset(ntwrks: NetworkData) {
        return ntwrks.networks.list[Networks.NOLUS].currencies.NLS.native!.ticker;
    }

    public static getNative(ntwrks: NetworkData, protocol: string) {
        const pr = AssetUtils.getProtocol(ntwrks, protocol);
        const native = pr.Native['dex_currency'];
        return AssetUtils.getAsset(ntwrks, native as string, ChainConstants.CHAIN_KEY as string, protocol);
    }

    private static getProtocol(ntwrks: NetworkData, protocol: string) {
        for (const key in ntwrks.protocols) {
            if (key == protocol) {
                return ntwrks.protocols[key];
            }
        }
        throw 'not supported protocol';
    }

    static getProtocols(ntwrks: NetworkData) {
        const protocols = [];
        for (const key in ntwrks.protocols) {
            protocols.push(key);
        }
        return protocols;
    }
}
