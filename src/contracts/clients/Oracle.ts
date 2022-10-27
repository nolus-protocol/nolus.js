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
    setConfigMsg,
    updateSwapTreeMsg,
} from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { FeedPrices } from '../types/FeedPrices';
import { Config } from '../types/Config';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { SwapNode } from '../types/SwapNode';

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

    public async getCurrencyPairs(): Promise<string[][]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrencyPairsMsg());
    }

    public async getSwapPath(fromCurrency: string, toCurrency: string): Promise<SwapNode[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getSwapPathMsg(fromCurrency, toCurrency));
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

    public async removeFeeder(nolusWallet: NolusWallet, feederWalletAddress: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, removeFeederMsg(feederWalletAddress), fee, undefined, fundCoin);
    }

    public async feedPrices(nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, feedPricesMsg(feedPrices), fee, undefined, fundCoin);
    }

    public async updateSwapTree(
        nolusWallet: NolusWallet,
        swapTree: ((string | number)[] | ((string | number)[] | (string | number)[][])[])[],
        fee: StdFee | 'auto' | number,
        fundCoin?: Coin[],
    ): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, updateSwapTreeMsg(swapTree), fee, undefined, fundCoin);
    }

    public async setConfig(nolusWallet: NolusWallet, priceFeedPeriod: number, expectedFeeders: number, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, setConfigMsg(priceFeedPeriod, expectedFeeders), fee, undefined, fundCoin);
    }
}
