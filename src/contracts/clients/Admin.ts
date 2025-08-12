import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { getProtocolsMsg, getProtocolMsg, getPlatformMsg } from '../messages';
import { Protocol } from '../types';
import { PlatformContracts } from '../types/PlatformContracts';

/**
 * The Admin contract is a contract that governs the storing and migration process of all smart contracts on the blockchain.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * adminInstance = new NolusContracts.Admin(cosm, adminContractAddress);
 * ```
 *
 */
export class Admin {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    /**
     * Retrieves all registered protocol identifiers supported by the platform.
     *
     * Each protocol entry represents a unique configuration for a network + DEX + LPN asset
     * (e.g. "OSMOSIS-OSMOSIS-ATOM" or "NEUTRON-ASTROPORT-USDC_NOBLE").
     *
     * @returns A `Promise` resolving to:
     * - An array of protocol identifiers (strings).
     */
    public async getProtocols(): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getProtocolsMsg());
    }

    /**
     * Retrieves detailed configuration for a specific protocol.
     *
     * The response includes the associated network and DEX, as well as the addresses
     * of all relevant contracts used by that protocol (leaser, LPP, oracle, etc.).
     *
     * @param protocol - The protocol identifier string (e.g. "OSMOSIS-OSMOSIS-USDC_NOBLE").
     *
     * @returns A `Promise` resolving to:
     * - An object containing the network, DEX name, and contract addresses.
     */
    public async getProtocol(protocol: string): Promise<Protocol> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getProtocolMsg(protocol));
    }

    /**
     * Retrieves the global platform-level contract addresses.
     *
     *  These are shared across all protocols and include system-level contracts like:
     * - `timealarms`: Contract handling time-based triggers
     * - `treasury`: The Treasury contract managing incentive and reserve flows
     *
     * @returns A `Promise` resolving to:
     * - An object with platform-wide contract addresses.
     */
    public async getPlatform(): Promise<PlatformContracts> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPlatformMsg());
    }
}
