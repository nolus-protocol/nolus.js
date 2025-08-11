import { closeLeaseMsg, closePositionLeaseMsg, getLeaseStatusMsg, repayLeaseMsg, changeClosePolicyMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseStatus } from '../types/LeaseStatus';
import { Asset } from '../types';

/**
 * Each Lease instance is an isolated margin position opened by a user.
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

    /**
     * Retrieves the current status of the margin position (lease).
     *
     * Optionally, a projection time in seconds can be provided to estimate
     * the loan interest and protocol (margin) interest due at that point in the future.
     *
     * @param dueProjectionSecs - Optional. Future projection time in seconds.
     *
     * @returns A `Promise` resolving to the current lease state, including:
     * - The leased asset and size of the position.
     * - Principal and interest amounts due.
     * - Overdue amounts (if any) and repayment deadline.
     * - Applied loan and protocol interest rates.
     * - Close policy (`stop_loss`, `take_profit`) if set.
     * - Lease status (e.g. `"idle"`, `"opened"`, `"closed"`).
     */
    public async getLeaseStatus(dueProjectionSecs?: number): Promise<LeaseStatus> {
        const leaseState = await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaseStatusMsg(dueProjectionSecs));

        return await this.findOperationType(leaseState);
    }

    /**
     * Executes a repayment toward the margin position’s outstanding debt.
     *
     * The repayment may include interest and/or principal. Any party can repay the lease,
     * not just the original borrower.
     *
     * @param nolusWallet - The wallet initiating the repayment.
     * @param fee - The gas fee for the transaction.
     * @param fundCoin - The amount and denomination of tokens used for repayment.
     *
     * @returns A `Promise` resolving to the transaction result, including:
     * - Transaction hash, gas used, and emitted repayment events.
     */
    public async repayLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, repayLeaseMsg(), fee, undefined, fundCoin);
    }

    /**
     * Simulates a repayment toward the margin position without executing it.
     *
     * @param nolusWallet - The wallet used for simulation.
     * @param fundCoin - The amount of tokens to simulate as repayment.
     *
     * @returns A `Promise` resolving to the simulated gas and fee data.
     */
    public async simulateRepayLeaseTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, repayLeaseMsg(), fundCoin);
    }

    /**
     * Finalizes the closure of a fully repaid margin position.
     *
     * This step is required to collect any remaining assets (excess funds)
     * after the debt has been fully settled.
     *
     * @param nolusWallet - The wallet initiating the closure.
     * @param fee - The gas fee for the transaction.
     * @param fundCoin - Optional. Additional tokens to fund the transaction.
     *
     * @returns A `Promise` resolving to the transaction result, including:
     * - Transaction hash, gas used, and emitted events for the closing.
     */
    public async closeLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, closeLeaseMsg(), fee, undefined, fundCoin);
    }

    /**
     * Simulates the final closure of a fully repaid lease without executing it.
     *
     * @param nolusWallet - The wallet used for simulation.
     * @param fundCoin - Optional. Simulated funding tokens.
     *
     * @returns A `Promise` resolving to the simulated gas and fee estimate.
     */
    public async simulateCloseLeaseTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, closeLeaseMsg(), fundCoin);
    }

    /**
     * Executes a partial or full market closure on an active position.
     *
     * If an amount is specified, only that portion of the position is closed.
     * Otherwise, the full position is closed (swapping the entire position for the LPN - liquidity pool's native - asset).
     *
     * @param nolusWallet - The wallet initiating the close.
     * @param fee - The gas fee for the transaction.
     * @param amount - Optional. The amount of the lease asset to close (partial close).
     * @param fundCoin - Optional. Additional tokens to fund the transaction.
     *
     * @returns A `Promise` resolving to the transaction result, including:
     * - Transaction hash, gas used, and emitted events for the partial/full market closing.
     */
    public async closePositionLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, amount?: Asset, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, closePositionLeaseMsg(amount), fee, undefined, fundCoin);
    }

    /**
     * Simulates a partial or full close on an active lease.
     *
     * @param nolusWallet - The wallet used for simulation.
     * @param amount - Optional. The lease asset amount to simulate closing.
     * @param fundCoin - Optional. Tokens to simulate as funding source.
     *
     * @returns A `Promise` resolving to the simulated gas and fee estimate.
     */
    public async simulateClosePositionLeaseTx(nolusWallet: NolusWallet, amount?: Asset, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, closePositionLeaseMsg(amount), fundCoin);
    }

    /**
     * Adjusts the `stop_loss` (SL) and/or `take_profit` (TP) thresholds for the margin position.
     *
     * These thresholds are expressed as LTV (loan-to-value) ratios in permilles.
     * To remove an existing stop-loss or take-profit, set the respective value to `null`.
     *
     * @param nolusWallet - The wallet requesting the update.
     * @param fee - The gas fee for the transaction.
     * @param stopLoss - Optional stop-loss threshold in permilles.
     * @param takeProfit - Optional take-profit threshold in permilles.
     * @param fundCoin - Optional. Additional tokens to fund the transaction.
     *
     * @returns A `Promise` resolving to the transaction result, including:
     * - Transaction hash, gas used, and emitted events for setting the SL/TP policy.
     */
    public async changeClosePolicy(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, stopLoss?: number | null, takeProfit?: number | null, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, changeClosePolicyMsg(stopLoss, takeProfit), fee, undefined, fundCoin);
    }

    /**
     * Simulates a change to the `stop_loss` and/or `take_profit` thresholds
     * without executing the update.
     *
     * @param nolusWallet - The wallet used for simulation.
     * @param stopLoss - Optional stop-loss threshold in permilles.
     * @param takeProfit - Optional take-profit threshold in permilles.
     * @param fundCoin - Optional. Tokens to simulate as funding source.
     *
     * @returns A `Promise` resolving to the simulated gas and fee estimate.
     */
    public async simulateChangeClosePolicyTx(nolusWallet: NolusWallet, stopLoss?: number | null, takeProfit?: number | null, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, changeClosePolicyMsg(stopLoss, takeProfit), fundCoin);
    }
}
