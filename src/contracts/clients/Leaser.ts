import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseApply, LeaserConfig } from '../types';
import { getCurrentOpenLeasesByOwnerMsg, getLeaserConfigMsg, leaseQuoteMsg, openLeaseMsg } from '../messages';
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
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Leaser {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async leaseQuote(downpaymentAmount: string, downpaymentCurrency: string, leaseAsset: string, max_ltv?: number): Promise<LeaseApply> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, leaseQuoteMsg(downpaymentAmount, downpaymentCurrency, leaseAsset, max_ltv));
    }

    public async getCurrentOpenLeasesByOwner(ownerAddress: string): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrentOpenLeasesByOwnerMsg(ownerAddress));
    }

    public async getLeaserConfig(): Promise<LeaserConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaserConfigMsg());
    }

    public async openLease(nolusWallet: NolusWallet, leaseCurrency: string, fee: StdFee | 'auto' | number, max_ltv?: number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, openLeaseMsg(leaseCurrency, max_ltv), fee, undefined, fundCoin);
    }

    public async simulateOpenLeaseTx(nolusWallet: NolusWallet, leaseCurrency: string, max_ltv?: number, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, openLeaseMsg(leaseCurrency, max_ltv), fundCoin);
    }
}
