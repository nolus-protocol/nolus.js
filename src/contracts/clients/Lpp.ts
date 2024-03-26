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
    getDepositCapacityMsg,
    getLppConfigMsg,
    getPriceMsg,
    depositMsg,
} from '../messages';
import { Balance, LoanInfo, LppBalance, LppConfig, Price, Rewards, DepositCapacity } from '../types';

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
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
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

    public async getDepositCapacity(): Promise<DepositCapacity | null> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getDepositCapacityMsg());
    }

    public async getLppConfig(): Promise<LppConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLppConfigMsg());
    }

    public async getLPN(): Promise<string> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLPNConfigMsg());
    }

    public async getPrice(): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPriceMsg());
    }

    public async getLenderRewards(lenderAddress: string): Promise<Rewards> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderRewardsMsg(lenderAddress));
    }

    public async getLenderDeposit(lenderAddress: string): Promise<Balance> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderDepositMsg(lenderAddress));
    }

    public async claimRewards(nolusWallet: NolusWallet, recipientAddress: string | undefined, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, claimRewardsMsg(recipientAddress), fee, undefined, fundCoin);
    }

    public async simulateClaimRewardsTx(nolusWallet: NolusWallet, recipientAddress: string | undefined, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, claimRewardsMsg(recipientAddress), fundCoin);
    }

    public async deposit(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, depositMsg(), fee, undefined, fundCoin);
    }

    public async simulateDepositTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, depositMsg(), fundCoin);
    }

    public async distributeRewards(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, distributeRewardsMsg(), fee, undefined, fundCoin);
    }

    public async simulateDistributeRewardsTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, distributeRewardsMsg(), fundCoin);
    }

    public async burnDeposit(nolusWallet: NolusWallet, burnAmount: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, burnMsg(burnAmount), fee, undefined, fundCoin);
    }

    public async simulateBurnDepositTx(nolusWallet: NolusWallet, burnAmount: string, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, burnMsg(burnAmount), fundCoin);
    }
}
