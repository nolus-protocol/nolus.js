import { Prices } from '../types';
import { NolusClient } from '../../client';
import { addFeederMsg, addFeedPriceMsg, getPrices, getSupportedPairs, updateSupportedPairsMsg } from '../messages/OracleMsg';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { FeedPayload } from '../types/FeedPayload';

export class Oracle {
    public async getPrices(contractAddress: string, denoms: string[]): Promise<Prices> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getPrices(denoms));
    }

    public async getSupportedPairs(contractAddress: string): Promise<[string[]]> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getSupportedPairs());
    }

    public async addFeeder(contractAddress: string, nolusWallet: NolusWallet, feederWalletAddress: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, addFeederMsg(feederWalletAddress), fee, undefined, fundCoin);
    }

    public async addFeedPrice(contractAddress: string, nolusWallet: NolusWallet, feedPayload: FeedPayload, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, addFeedPriceMsg(feedPayload), fee, undefined, fundCoin);
    }

    public async updateSupportPairs(contractAddress: string, nolusWallet: NolusWallet, pairs: [string[]], fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, updateSupportedPairsMsg(pairs), fee, undefined, fundCoin);
    }
}
