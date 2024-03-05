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

    public async getProtocols(): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getProtocolsMsg());
    }

    public async getProtocol(protocol: string): Promise<Protocol> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getProtocolMsg(protocol));
    }

    public async getPlatform(): Promise<PlatformContracts> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPlatformMsg());
    }
}
