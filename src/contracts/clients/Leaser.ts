import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseApply, LeaserConfig } from '../types';
import { getCurrentOpenLeasesByOwnerMsg, getLeaserConfigMsg, leaseQuoteMsg, openLeaseMsg, setLeaserConfigMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';

/**
 * A customer-facing smart contract keeping a register of customer's Lease instances.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * leaserInstance = new NolusContracts.Leaser(cosm, leaserContractAddress);
 * ```
 */
export class Leaser {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async leaseQuote(downpaymentAmount: string, downpaymentCurrency: string, leaseAsset: string): Promise<LeaseApply> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, leaseQuoteMsg(downpaymentAmount, downpaymentCurrency, leaseAsset));
    }

    public async getCurrentOpenLeasesByOwner(ownerAddress: string): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrentOpenLeasesByOwnerMsg(ownerAddress));
    }

    public async getLeaserConfig(): Promise<LeaserConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaserConfigMsg());
    }

    public async openLease(nolusWallet: NolusWallet, leaseCurrency: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, openLeaseMsg(leaseCurrency), fee, undefined, fundCoin);
    }

    public async setLeaserConfig(nolusWallet: NolusWallet, leaserConfig: LeaserConfig, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, setLeaserConfigMsg(leaserConfig), fee, undefined, fundCoin);
    }
}
