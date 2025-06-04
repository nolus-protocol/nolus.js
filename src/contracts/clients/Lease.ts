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

    // ******************************* internal ************************** //

    private async findOperationType(leaseState: LeaseStatus): Promise<LeaseStatus> {
        if (!leaseState?.opened?.amount?.amount || typeof leaseState?.opened?.status === 'string' || !leaseState?.opened?.status?.in_progress) {
            return leaseState;
        }

        const amount = leaseState.opened.amount.amount;
        const in_progress = leaseState.opened.status.in_progress;

        if ('close' in in_progress && in_progress.close) {
            const additional_data = { type: amount === String(in_progress.close.close.amount) ? 'Full' : 'Partial' };
            in_progress.close = { ...in_progress.close, ...additional_data };
        } else if ('liquidation' in in_progress && in_progress.liquidation) {
            const additional_data = { type: amount === String(in_progress.liquidation.liquidation.amount) ? 'Full' : 'Partial' };
            in_progress.liquidation = { ...in_progress.liquidation, ...additional_data };
        }
        return leaseState;
    }

    // ******************************************************************* //

    public async getLeaseStatus(dueProjectionSecs?: number): Promise<LeaseStatus> {
        const leaseState = await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaseStatusMsg(dueProjectionSecs));

        return await this.findOperationType(leaseState);
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
