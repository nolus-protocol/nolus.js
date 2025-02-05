import { closeLeaseMsg, closePositionLeaseMsg, getLeaseStatusMsg, repayLeaseMsg, changeClosePolicyMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseStatus } from '../types/LeaseStatus';
import { Asset } from '../types';

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
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Lease {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async getLeaseStatus(dueProjectionSecs?: number): Promise<LeaseStatus> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaseStatusMsg(dueProjectionSecs));
    }

    public async repayLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, repayLeaseMsg(), fee, undefined, fundCoin);
    }

    public async simulateRepayLeaseTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, repayLeaseMsg(), fundCoin);
    }

    public async closeLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, closeLeaseMsg(), fee, undefined, fundCoin);
    }

    public async simulateCloseLeaseTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, closeLeaseMsg(), fundCoin);
    }

    public async closePositionLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, amount?: Asset, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, closePositionLeaseMsg(amount), fee, undefined, fundCoin);
    }

    public async simulateClosePositionLeaseTx(nolusWallet: NolusWallet, amount?: Asset, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, closePositionLeaseMsg(amount), fundCoin);
    }

    public async changeClosePolicy(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, stopLoss?: number | null, takeProfit?: number | null, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, changeClosePolicyMsg(stopLoss, takeProfit), fee, undefined, fundCoin);
    }

    public async simulateChangeClosePolicyTx(nolusWallet: NolusWallet, stopLoss?: number | null, takeProfit?: number | null, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, changeClosePolicyMsg(stopLoss, takeProfit), fundCoin);
    }
}
