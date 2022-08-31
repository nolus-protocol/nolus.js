import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseApply, LeaserConfig } from '../types';
import { getCurrentOpenLeasesMsg, getLeaserConfigMsg, makeLeaseApplyMsg, openLeaseMsg, setLeaserConfigMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';

export class Leaser {
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

    public async getLeaserConfig(contractAddress: string): Promise<LeaserConfig> {
        return await this.cosmWasmClient.queryContractSmart(contractAddress, getLeaserConfigMsg());
    }

    public async openLease(contractAddress: string, nolusWallet: NolusWallet, leaseDenom: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, openLeaseMsg(leaseDenom), fee, undefined, fundCoin);
    }

    public async setLeaserConfig(contractAddress: string, nolusWallet: NolusWallet, leaserConfig: LeaserConfig, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, setLeaserConfigMsg(leaserConfig), fee, undefined, fundCoin);
    }
}
