import { Prices } from '../types';
import { addFeederMsg, feedPricesMsg, getConfigMsg, getFeedersMsg, getPricesForMsg, getSupportedPairs, isFeederMsg, setConfigMsg, updateSupportedPairsMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { FeedPrices } from '../types/FeedPrices';
import { Config } from '../types/Config';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

export class Oracle {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async getPricesFor(denoms: string[]): Promise<Prices> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPricesForMsg(denoms));
    }

    public async getSupportedPairs(): Promise<string[][]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getSupportedPairs());
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

    public async feedPrices(nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, feedPricesMsg(feedPrices), fee, undefined, fundCoin);
    }

    public async updateSupportPairs(nolusWallet: NolusWallet, pairs: string[][], fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, updateSupportedPairsMsg(pairs), fee, undefined, fundCoin);
    }

    public async setConfig(nolusWallet: NolusWallet, priceFeedPeriod: number, feedersPrecentageNeeded: number, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, setConfigMsg(priceFeedPeriod, feedersPrecentageNeeded), fee, undefined, fundCoin);
    }
}
