import { Price } from '../types';
import {
    addFeederMsg,
    feedPricesMsg,
    getConfigMsg,
    getFeedersMsg,
    getPriceForMsg,
    getPricesForMsg,
    getCurrencyPairsMsg,
    getSwapPathMsg,
    isFeederMsg,
    removeFeederMsg,
    updateConfigMsg,
    updateSwapTreeMsg,
    getSwapTreeMsg,
} from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { FeedPrices } from '../types/FeedPrices';
import { Config } from '../types/Config';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { SwapPath } from '../types/SwapPath';
import { SwapTree, Tree } from '../types/SwapTree';
import { CurrencyPair } from '../types/CurrencyPair';
import { OraclePriceConfig } from '../types/OraclePriceConfig';

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

    public async getPricesFor(currencies: string[]): Promise<Price[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPricesForMsg(currencies));
    }

    public async getPriceFor(currency: string): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPriceForMsg(currency));
    }

    public async getCurrencyPairs(): Promise<CurrencyPair[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrencyPairsMsg());
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

    public async getConfig(): Promise<Config> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getConfigMsg());
    }

    public async addFeeder(nolusWallet: NolusWallet, feederWalletAddress: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, addFeederMsg(feederWalletAddress), fee, undefined, fundCoin);
    }

    public async simulateAddFeederTx(nolusWallet: NolusWallet, feederWalletAddress: string, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, addFeederMsg(feederWalletAddress), fundCoin);
    }

    public async removeFeeder(nolusWallet: NolusWallet, feederWalletAddress: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, removeFeederMsg(feederWalletAddress), fee, undefined, fundCoin);
    }

    public async simulateRemoveFeederTx(nolusWallet: NolusWallet, feederWalletAddress: string, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, removeFeederMsg(feederWalletAddress), fundCoin);
    }

    public async feedPrices(nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, feedPricesMsg(feedPrices), fee, undefined, fundCoin);
    }

    public async simulateFeedPricesTx(nolusWallet: NolusWallet, feedPrices: FeedPrices, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, feedPricesMsg(feedPrices), fundCoin);
    }

    public async updateSwapTree(nolusWallet: NolusWallet, swapTree: Tree, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, updateSwapTreeMsg(swapTree), fee, undefined, fundCoin);
    }

    public async simulateUpdateSwapTreeTx(nolusWallet: NolusWallet, swapTree: Tree, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, updateSwapTreeMsg(swapTree), fundCoin);
    }

    public async updateConfig(nolusWallet: NolusWallet, priceConfig: OraclePriceConfig, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, updateConfigMsg(priceConfig), fee, undefined, fundCoin);
    }

    public async simulateUpdateConfigTx(nolusWallet: NolusWallet, priceConfig: OraclePriceConfig, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, updateConfigMsg(priceConfig), fundCoin);
    }
}
