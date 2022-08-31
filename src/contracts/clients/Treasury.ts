import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { configRewardsTransferMsg, getLoanInformationMsg, getLppBalanceMsg, getLppConfigMsg, getOutstandingInterestMsg, getPriceMsg, sendRewardsMsg } from '../messages';
import { Asset, LoanInfo, LppBalance, LppConfig, Price } from '../types';

export class Treasury {
    private cosmWasmClient!: CosmWasmClient;

    constructor(cosmWasmClient: CosmWasmClient) {
        this.cosmWasmClient = cosmWasmClient;
    }

    public async configRewardsTransfer(contractAddress: string, nolusWallet: NolusWallet, address: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, configRewardsTransferMsg(address), fee, undefined, fundCoin);
    }

    public async sendRewardsMsg(contractAddress: string, nolusWallet: NolusWallet, rewards: Asset, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, sendRewardsMsg(rewards), fee, undefined, fundCoin);
    }
}
