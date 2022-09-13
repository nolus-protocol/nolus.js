import { closeLeaseMsg, getLeaseStatusMsg, repayLeaseMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseStatus } from '../types/LeaseStatus';

export class Lease {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    get contractAddress(): string {
        return this._contractAddress;
    }

    set contractAddress(value: string) {
        this._contractAddress = value;
    }

    public async getLeaseStatus(): Promise<LeaseStatus> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaseStatusMsg());
    }

    public async repayLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, repayLeaseMsg(), fee, undefined, fundCoin);
    }

    public async closeLease(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, closeLeaseMsg(), fee, undefined, fundCoin);
    }
}
