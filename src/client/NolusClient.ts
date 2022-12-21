import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { Coin } from '@cosmjs/proto-signing';
import { toHex } from '@cosmjs/encoding';
import { IndexedTx } from '@cosmjs/stargate';

/**
 * Nolus Client service class.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient } from '@nolus/nolusjs';
 *
 * NolusClient.setInstance(tendermintRpc);
 * ```
 */
export class NolusClient {
    private static instance: NolusClient | null = null;
    protected cosmWasmClient: Promise<CosmWasmClient> | undefined;
    protected tmClient: Promise<Tendermint34Client> | undefined;

    private constructor(tendermintRpc: string) {
        this.cosmWasmClient = CosmWasmClient.connect(tendermintRpc);
        this.tmClient = Tendermint34Client.connect(tendermintRpc);
    }

    static getInstance() {
        if (this.instance === null) {
            throw new Error('Set the Tendermint RPC address before getting instance');
        }
        return this.instance;
    }

    static setInstance(tendermintRpc: string) {
        this.instance = new NolusClient(tendermintRpc);
    }

    public async getCosmWasmClient(): Promise<CosmWasmClient> {
        const client = await this.cosmWasmClient;
        if (!client) {
            throw new Error('Missing CosmWasm client');
        }
        return client;
    }

    public async getTendermintClient(): Promise<Tendermint34Client> {
        const client = await this.tmClient;
        if (!client) {
            throw new Error('Missing Tendermint client');
        }
        return client;
    }

    public getChainId = async (): Promise<string> => {
        const client = await this.cosmWasmClient;
        const chainId = await client?.getChainId();
        if (!chainId) {
            throw new Error('Chain ID is missing!');
        }
        return chainId;
    };

    public async getBalance(address: string, denom: string): Promise<Coin> {
        const client = await this.cosmWasmClient;
        const balance = client?.getBalance(address, denom);
        if (!balance) {
            throw new Error('Balance is missing!');
        }
        return await balance;
    }

    public async getBlockHeight(): Promise<number> {
        const client = await this.cosmWasmClient;
        const block = await client?.getBlock();
        if (!block?.header) {
            throw new Error('Block height is missing!');
        }
        return block?.header.height;
    }

    private async txsQuery(query: string) {
        const tmClient = await NolusClient.getInstance().getTendermintClient();
        const results = await tmClient?.txSearchAll({ query: query });

        return results?.txs.map((tx) => {
            return {
                height: tx.height,
                hash: toHex(tx.hash).toUpperCase(),
                code: tx.result.code,
                rawLog: tx.result.log || '',
                tx: tx.tx,
                gasUsed: tx.result.gasUsed,
                gasWanted: tx.result.gasWanted,
            };
        });
    }

    /**
     * Search tx by address in all modules.
     */
    public async searchTxByAddress(address: string): Promise<readonly IndexedTx[]> {
        let txs: readonly IndexedTx[] = [];
        const bankSenderQuery = `message.module='bank' AND transfer.sender='${address}'`;
        const bankReceiverQuery = `message.module='bank' AND transfer.recipient='${address}'`;
        const wasmSenderQuery = `message.module='wasm' AND transfer.sender='${address}'`;
        const wasmReceiverQuery = `message.module='wasm' AND transfer.recipient='${address}'`;
        const stakingSenderQuery = `message.module='staking' AND transfer.sender='${address}'`;
        const stakingReceiverQuery = `message.module='staking' AND transfer.recipient='${address}'`;

        const [bankSent, bankReceived, wasmSent, wasmReceived, stakingSent, stakingReceived] = await Promise.all(
            [bankSenderQuery, bankReceiverQuery, wasmSenderQuery, wasmReceiverQuery, stakingSenderQuery, stakingReceiverQuery].map((rawQuery) => this.txsQuery(rawQuery)),
        );

        const bankSentHashes = bankSent.map((t) => t.hash);
        const wasmSentHashes = wasmSent.map((t) => t.hash);
        const stakingSentHashes = stakingSent.map((t) => t.hash);

        txs = [
            ...bankSent,
            ...bankReceived.filter((tx) => !bankSentHashes.includes(tx.hash)),
            ...wasmSent,
            ...wasmReceived.filter((tx) => !wasmSentHashes.includes(tx.hash)),
            ...stakingSent,
            ...stakingReceived.filter((tx) => !stakingSentHashes.includes(tx.hash)),
        ];

        return txs;
    }
}
