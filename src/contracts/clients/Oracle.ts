import { Prices } from '../types';
import { addFeederMsg, addFeedPriceMsg, changeConfigMsg, getConfigMsg, getFeedersMsg, getPrice, getPrices, getSupportedPairs, isFeederMsg, updateSupportedPairsMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { FeedPrices } from '../types/FeedPrices';
import { Config } from '../types/Config';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Price } from '../types/Price';

export class Oracle {
    private cosmWasmClient!: CosmWasmClient;

    constructor(cosmWasmClient: CosmWasmClient) {
        this.cosmWasmClient = cosmWasmClient;
    }

    public async getPrices(contractAddress: string, denoms: string[]): Promise<Prices> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getPrices(denoms));
    }

    public async getSupportedPairs(contractAddress: string): Promise<string[][]> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getSupportedPairs());
    }

    public async isFeeder(contractAddress: string, address: string): Promise<boolean> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, isFeederMsg(address));
    }

    public async getFeeders(contractAddress: string): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getFeedersMsg());
    }

    public async getConfig(contractAddress: string): Promise<Config> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getConfigMsg());
    }

    public async getPrice(contractAddress: string): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getPrice());
    }

    public async addFeeder(contractAddress: string, nolusWallet: NolusWallet, feederWalletAddress: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, addFeederMsg(feederWalletAddress), fee, undefined, fundCoin);
    }

    public async addFeedPrice(contractAddress: string, nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, addFeedPriceMsg(feedPrices), fee, undefined, fundCoin);
    }

    public async updateSupportPairs(contractAddress: string, nolusWallet: NolusWallet, pairs: string[][], fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, updateSupportedPairsMsg(pairs), fee, undefined, fundCoin);
    }

    public async changeConfig(
        contractAddress: string,
        nolusWallet: NolusWallet,
        priceFeedPeriod: number,
        feedersPrecentageNeeded: number,
        fee: StdFee | 'auto' | number,
        fundCoin?: Coin[],
    ): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, changeConfigMsg(priceFeedPeriod, feedersPrecentageNeeded), fee, undefined, fundCoin);
    }
}
