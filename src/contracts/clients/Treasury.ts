import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { sendRewardsMsg } from '../messages';
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
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Treasury {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async sendRewards(nolusWallet: NolusWallet, rewards: Asset, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, sendRewardsMsg(rewards), fee, undefined, fundCoin);
    }

    public async simulateSendRewardsTx(nolusWallet: NolusWallet, rewards: Asset, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, sendRewardsMsg(rewards), fundCoin);
    }
}
