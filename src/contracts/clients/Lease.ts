import { Asset, Balance, LeaseApply, LeaserConfig, LoanInfo, LppBalance, LppConfig, Rewards } from '../types';
import {
    claimRewardsMsg,
    closeLeaseMsg,
    distributeRewardsMsg,
    getCurrentOpenLeasesMsg,
    getLeaserConfigMsg,
    getLeaseStatusMsg,
    getLenderDepositMsg,
    getLenderRewardsMsg,
    getLoanInformationMsg,
    getLppBalanceMsg,
    getLppConfigMsg,
    getOutstandingInterestMsg,
    lenderDepositMsg,
    makeLeaseApplyMsg,
    openLeaseMsg,
    repayLeaseMsg,
    setLeaserConfigMsg,
} from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { LeaseInfo } from '../types/LeaseInfo';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseStatus } from '../types/LeaseStatus';

export class Lease {
    private cosmWasmClient!: CosmWasmClient;

    constructor(cosmWasmClient: CosmWasmClient) {
        this.cosmWasmClient = cosmWasmClient;
    }

    public async makeLeaseApply(contractAddress: string, amount: string, symbol: string): Promise<LeaseApply> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, makeLeaseApplyMsg(amount, symbol));
    }

    public async getCurrentOpenLeases(contractAddress: string, ownerAddress: string): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getCurrentOpenLeasesMsg(ownerAddress));
    }

    public async getLeaseStatus(contractAddress: string): Promise<LeaseStatus> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLeaseStatusMsg());
    }

    public async getLeaserConfig(contractAddress: string): Promise<LeaserConfig> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLeaserConfigMsg());
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

    public async openLease(contractAddress: string, nolusWallet: NolusWallet, leaseDenom: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, openLeaseMsg(leaseDenom), fee, undefined, fundCoin);
    }

    public async repayLease(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, repayLeaseMsg(), fee, undefined, fundCoin);
    }

    public async closeLease(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, closeLeaseMsg(), fee, undefined, fundCoin);
    }

    public async setLeaserConfig(contractAddress: string, nolusWallet: NolusWallet, leaserConfig: LeaserConfig, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, setLeaserConfigMsg(leaserConfig), fee, undefined, fundCoin);
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
}
