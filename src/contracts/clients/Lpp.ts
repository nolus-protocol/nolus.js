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

/**
 * The Lpp is a complex smart contract. We can consider three points of view:
 * - There is an Lpp instance per currency that serves all borrow requests and repayments in that same currency;
 * - There is an Lpp instance per currency, serving all lenders that provide liquidity in that same currency;
 * - There is an Lpp instance per currency which regularly receives rewards from the Rewards Dispatcher contract.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * lppInstance = new NolusContracts.Lpp(cosm, lppContractAddress);
 * ```
 */
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

    public async claimRewardsData(nolusWallet: NolusWallet, recipientAddress: string | undefined, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, claimRewardsMsg(recipientAddress), undefined, fundCoin);
    }

    public async getLenderDeposit(lenderAddress: string): Promise<Balance> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderDepositMsg(lenderAddress));
    }

    public async deposit(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, depositMsg(), fee, undefined, fundCoin);
    }

    public async depositData(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, depositMsg(), undefined, fundCoin);
    }

    public async distributeRewards(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, distributeRewardsMsg(), fee, undefined, fundCoin);
    }

    public async distributeRewardsData(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, distributeRewardsMsg(), undefined, fundCoin);
    }

    public async burnDeposit(nolusWallet: NolusWallet, burnAmount: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, burnMsg(burnAmount), fee, undefined, fundCoin);
    }

    public async burnDepositData(nolusWallet: NolusWallet, burnAmount: string, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, burnMsg(burnAmount), undefined, fundCoin);
    }
}
