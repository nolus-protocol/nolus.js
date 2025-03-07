import { closeLeaseMsg, closePositionLeaseMsg, getLeaseStatusMsg, repayLeaseMsg, changeClosePolicyMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { AdditionalData, LeaseStatus } from '../types/LeaseStatus';
import { Asset } from '../types';
import { fromUtf8, toUtf8 } from '@cosmjs/encoding';

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

    // Helper function to fetch raw lease state and extract necessary data
    private async getAdditionalDataFromRawState(leaseRawState: Uint8Array | null, type: 'Close' | 'Liquidation'): Promise<AdditionalData | null> {
        if (!leaseRawState) return null;

        const parsedRawState = JSON.parse(fromUtf8(leaseRawState));

        const operationType = Object.keys(parsedRawState)[0];
        if (!operationType) return null;

        if (type === 'Close') {
            return { type: operationType };
        } else if (type === 'Liquidation') {
            const dynamicSubstateKey = Object.keys(parsedRawState[operationType] || {})[0];
            if (!dynamicSubstateKey) return null;

            const causeObj = parsedRawState[operationType]?.[dynamicSubstateKey]?.spec?.repayable?.cause;
            if (!causeObj) return null;

            const liqCause = Object.keys(causeObj)[0];

            return { type: operationType, cause: liqCause };
        }
        return null;
    }

    // ******************************************************************* //

    public async getLeaseStatus(dueProjectionSecs?: number): Promise<LeaseStatus> {
        const [leaseState, leaseRawState] = await Promise.all([
            this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaseStatusMsg(dueProjectionSecs)),
            this.cosmWasmClient.queryContractRaw(this._contractAddress, toUtf8('state')),
        ]);

        let additional_data: AdditionalData | null = null;
        const inProgress = leaseState.opened?.in_progress;

        if (inProgress && typeof inProgress === 'object' && 'close' in inProgress && 'in_progress' in inProgress.close) {
            additional_data = await this.getAdditionalDataFromRawState(leaseRawState, 'Close');
        } else if (inProgress && typeof inProgress === 'object' && 'liquidation' in inProgress && 'in_progress' in inProgress.liquidation) {
            additional_data = await this.getAdditionalDataFromRawState(leaseRawState, 'Liquidation');
        }
        return { ...leaseState, additional_data };
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
