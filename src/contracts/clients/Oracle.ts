import { Prices } from '../types';
import { NolusClient } from '../../client';
import { addFeederMsg, addFeedPriceMsg, changeConfigMsg, getConfigMsg, getFeedersMsg, getPrices, getSupportedPairs, isFeederMsg, updateSupportedPairsMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { FeedPrices } from '../types/FeedPrices';
import { Config } from '../types/Config';

export class Oracle {
    public async getPrices(contractAddress: string, denoms: string[]): Promise<Prices> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getPrices(denoms));
    }

    public async getSupportedPairs(contractAddress: string): Promise<string[][]> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getSupportedPairs());
    }

    public async isFeeder(contractAddress: string, address: string): Promise<boolean> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, isFeederMsg(address));
    }

    public async getFeeders(contractAddress: string): Promise<string[]> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getFeedersMsg());
    }

    public async getConfig(contractAddress: string): Promise<Config> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getConfigMsg());
    }

    public async addFeeder(contractAddress: string, nolusWallet: NolusWallet, feederWalletAddress: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, addFeederMsg(feederWalletAddress), fee, undefined, fundCoin);
    }

    public async addFeedPrice(contractAddress: string, nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, addFeedPriceMsg(feedPrices), fee, undefined, fundCoin);
    }

    public async updateSupportPairs(contractAddress: string, nolusWallet: NolusWallet, pairs: string[][], fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, updateSupportedPairsMsg(pairs), fee, undefined, fundCoin);
    }

    public async changeConfig(
        contractAddress: string,
        nolusWallet: NolusWallet,
        priceFeedPeriod: number,
        feedersPrecentageNeeded: number,
        fee: StdFee | 'auto' | number,
        fundCoin?: Coin[],
    ): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, changeConfigMsg(priceFeedPeriod, feedersPrecentageNeeded), fee, undefined, fundCoin);
    }
}
