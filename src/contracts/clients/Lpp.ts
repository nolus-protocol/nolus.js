import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import {
    burnMsg,
    claimRewardsMsg,
    distributeRewardsMsg,
    getLenderDepositMsg,
    getLenderRewardsMsg,
    getLoanInformationMsg,
    getLppBalanceMsg,
    getLppConfigMsg,
    getOutstandingInterestMsg,
    getPriceMsg,
    depositMsg,
} from '../messages';
import { Asset, Balance, LoanInfo, LppBalance, LppConfig, Price, Rewards } from '../types';

export class Lpp {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async getLoanInformation(leaseAddress: string): Promise<LoanInfo> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLoanInformationMsg(leaseAddress));
    }

    public async getLppBalance(): Promise<LppBalance> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLppBalanceMsg());
    }

    public async getLppConfig(): Promise<LppConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLppConfigMsg());
    }

    public async getOutstandingInterest(leaseAddress: string, outstandingTime: string): Promise<Asset> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getOutstandingInterestMsg(leaseAddress, outstandingTime));
    }

    public async getPrice(): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPriceMsg());
    }

    public async getLenderRewards(lenderAddress: string): Promise<Rewards> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderRewardsMsg(lenderAddress));
    }

    public async claimRewards(nolusWallet: NolusWallet, recipientAddress: string | undefined, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, claimRewardsMsg(recipientAddress), fee, undefined, fundCoin);
    }

    public async getLenderDeposit(lenderAddress: string): Promise<Balance> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderDepositMsg(lenderAddress));
    }

    public async deposit(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, depositMsg(), fee, undefined, fundCoin);
    }

    public async distributeRewards(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, distributeRewardsMsg(), fee, undefined, fundCoin);
    }

    public async burnDeposit(nolusWallet: NolusWallet, burnAmount: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, burnMsg(burnAmount), fee, undefined, fundCoin);
    }
}
