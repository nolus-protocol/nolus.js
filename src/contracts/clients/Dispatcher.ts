import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { calculateRewardsMsg } from '../messages';

/**
 * The role of this single instance smart contract is to calculate rewards in uNLS depending on the TVL of all LPPs,
 * and to distribute it to each LPP.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * dispatcherInstance = new NolusContracts.Dispatcher(cosm, dispatcherContractAddress);
 * ```
 *
 */

export class Disparcher {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    public async calculateRewards(): Promise<number> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, calculateRewardsMsg());
    }
}
