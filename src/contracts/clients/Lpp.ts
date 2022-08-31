import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import {
    burnMsg,
    claimRewardsMsg,
    configRewardsTransferMsg,
    distributeRewardsMsg,
    getLenderDepositMsg,
    getLenderRewardsMsg,
    getLoanInformationMsg,
    getLppBalanceMsg,
    getLppConfigMsg,
    getOutstandingInterestMsg,
    getPriceMsg,
    lenderDepositMsg,
    sendRewardsMsg,
} from '../messages';
import { Asset, Balance, LoanInfo, LppBalance, LppConfig, Price, Rewards } from '../types';

export class Lpp {
    private cosmWasmClient!: CosmWasmClient;

    constructor(cosmWasmClient: CosmWasmClient) {
        this.cosmWasmClient = cosmWasmClient;
    }

    public async getLoanInformation(contractAddress: string, leaseAddress: string): Promise<LoanInfo> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLoanInformationMsg(leaseAddress));
    }

    public async getLppBalance(contractAddress: string): Promise<LppBalance> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLppBalanceMsg());
    }

    public async getLppConfig(contractAddress: string): Promise<LppConfig> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLppConfigMsg());
    }

    public async getOutstandingInterest(contractAddress: string, leaseAddr: string, outstandingTime: string): Promise<Asset> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getOutstandingInterestMsg(leaseAddr, outstandingTime));
    }

    public async getPrice(contractAddress: string): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getPriceMsg());
    }

    public async getLenderRewards(contractAddress: string, address: string): Promise<Rewards> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLenderRewardsMsg(address));
    }

    public async claimRewards(contractAddress: string, nolusWallet: NolusWallet, address: string | undefined, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, claimRewardsMsg(address), fee, undefined, fundCoin);
    }

    public async getLenderDeposit(contractAddress: string, lenderWalletAddr: string): Promise<Balance> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLenderDepositMsg(lenderWalletAddr));
    }

    public async lenderDeposit(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, lenderDepositMsg(), fee, undefined, fundCoin);
    }

    public async distributeRewards(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, distributeRewardsMsg(), fee, undefined, fundCoin);
    }

    public async burnDeposit(contractAddress: string, nolusWallet: NolusWallet, burnAmount: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, burnMsg(burnAmount), fee, undefined, fundCoin);
    }
}
