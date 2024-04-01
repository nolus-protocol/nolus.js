import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Price } from '../types';
import { feedPricesMsg, getConfigMsg, getFeedersMsg, getPriceForMsg, getPricesMsg, getCurrencyPairsMsg, getSwapPathMsg, isFeederMsg, getSwapTreeMsg, getCurrenciesMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { FeedPrices } from '../types/FeedPrices';
import { OracleConfig } from '../types/OracleConfig';
import { SwapPath } from '../types/SwapPath';
import { SwapTree } from '../types/SwapTree';
import { CurrencyInfo } from '../types/CurrencyInfo';

/**
 * An on-chain oracle providing market data prices to the rest of the system.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * oracleInstance = new NolusContracts.Oracle(cosm, oracleContractAddress);
 * ```
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Oracle {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async getPrices(): Promise<{ [key: string]: Price }> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPricesMsg());
    }

    public async getPriceFor(currency: string): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPriceForMsg(currency));
    }

    public async getCurrencyPairs(): Promise<[string, [number, string]][]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrencyPairsMsg());
    }

    public async getCurrencies(): Promise<CurrencyInfo[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrenciesMsg());
    }

    public async getSwapPath(fromCurrency: string, toCurrency: string): Promise<SwapPath[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getSwapPathMsg(fromCurrency, toCurrency));
    }

    public async getSwapTree(): Promise<SwapTree> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getSwapTreeMsg());
    }

    public async isFeeder(address: string): Promise<boolean> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, isFeederMsg(address));
    }

    public async getFeeders(): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getFeedersMsg());
    }

    public async getConfig(): Promise<OracleConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getConfigMsg());
    }

    public async feedPrices(nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, feedPricesMsg(feedPrices), fee, undefined, fundCoin);
    }

    public async simulateFeedPricesTx(nolusWallet: NolusWallet, feedPrices: FeedPrices, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, feedPricesMsg(feedPrices), fundCoin);
    }
}
