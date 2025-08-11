import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { calculateRewardsMsg } from '../messages';

/**
 * The most important role of this single instance smart contract is to calculate rewards in uNLS depending on the TVL of all LPPs,
 * and to distribute it to each LPP.
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
 */

export class Treasury {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    /**
     * Gets the calculated the amount of uNLS rewards to be distributed across all active LPPs.
     *
     * The value is determined based on the current total value locked (TVL) in each pool.
     * This function returns the total reward amount but does not perform the distribution itself.
     *
     *  @returns A `Promise` resolving to:
     * - The total reward amount (as a number) in micro-NLS (`uNLS`) to be distributed.
     */
    public async calculateRewards(): Promise<number> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, calculateRewardsMsg());
    }
}
