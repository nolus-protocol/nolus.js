import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { configRewardsTransferMsg, sendRewardsMsg } from '../messages';
import { Asset } from '../types';

/**
 * The Treasury has the basic functionality available to a regular account. We envision its role as a collector of fees and profit,
 * and as a source of rewards directed to lenders via Liquidity Pools.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * treasuryInstance = new NolusContracts.Treasury(cosm, treasuryContractAddress);
 * ```
 */
export class Treasury {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async configRewardsTransfer(nolusWallet: NolusWallet, address: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, configRewardsTransferMsg(address), fee, undefined, fundCoin);
    }

    public async configRewardsTransferData(nolusWallet: NolusWallet, address: string, fundCoin?: Coin[]) {
        return nolusWallet.executeContractData(this._contractAddress, configRewardsTransferMsg(address), undefined, fundCoin);
    }

    public async sendRewards(nolusWallet: NolusWallet, rewards: Asset, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, sendRewardsMsg(rewards), fee, undefined, fundCoin);
    }

    public async sendRewardsData(nolusWallet: NolusWallet, rewards: Asset, fundCoin?: Coin[]){
        return nolusWallet.executeContractData(this._contractAddress, sendRewardsMsg(rewards), undefined, fundCoin);
    }
}
