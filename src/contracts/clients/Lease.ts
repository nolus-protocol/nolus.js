import { closeLeaseMsg, getLeaseStatusMsg, repayLeaseMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseStatus } from '../types/LeaseStatus';

/**
 * Each Lease instance tracks a new customer's lease.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * leaseInstance = new NolusContracts.Lease(cosm, leaseContractAddress);
 * ```
 */
export class Lease {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async getLeaseStatus(): Promise<LeaseStatus> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaseStatusMsg());
    }

    public async repayLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, repayLeaseMsg(), fee, undefined, fundCoin);
    }

    public async repayLeaseData(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, repayLeaseMsg(), undefined, fundCoin);
    }

    public async closeLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, closeLeaseMsg(), fee, undefined, fundCoin);
    }

    public async closeLeaseData(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, closeLeaseMsg(), undefined, fundCoin);
    }
}
