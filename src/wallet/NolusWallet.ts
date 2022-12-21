import { SigningCosmWasmClient, SigningCosmWasmClientOptions } from '@cosmjs/cosmwasm-stargate';
import { Coin, EncodeObject, OfflineSigner } from '@cosmjs/proto-signing';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import stargate_1, { DeliverTxResponse, isDeliverTxFailure, StdFee } from '@cosmjs/stargate';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { toUtf8 } from '@cosmjs/encoding';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { ContractData } from '../contracts/types/ContractData';

/**
 * Nolus Wallet service class.
 *
 * Usage:
 *
 * ```ts
 * import { nolusOfflineSigner } from '@nolus/nolusjs/build/wallet/NolusWalletFactory';
 *
 * const nolusWallet = await nolusOfflineSigner(offlineSigner);
 * nolusWallet.useAccount();
 * ```
 */
export class NolusWallet extends SigningCosmWasmClient {
    address?: string;
    pubKey?: Uint8Array;
    algo?: string;

    protected offlineSigner: OfflineSigner;

    constructor(tmClient: Tendermint34Client | undefined, signer: OfflineSigner, options: SigningCosmWasmClientOptions) {
        super(tmClient, signer, options);
        this.offlineSigner = signer;
    }

    public async useAccount(): Promise<boolean> {
        const accounts = await this.offlineSigner.getAccounts();
        if (accounts.length === 0) {
            throw new Error('Missing account');
        }

        this.address = accounts[0].address;
        this.pubKey = accounts[0].pubkey;
        this.algo = accounts[0].algo;

        return true;
    }

    public async transferAmount(receiverAddress: string, amount: Coin[], fee: StdFee | 'auto' | number, memo?: string): Promise<DeliverTxResponse> {
        if (!this.address) {
            throw new Error('Sender address is missing');
        }
        return this.sendTokens(this.address, receiverAddress, amount, fee, memo);
    }

    public async executeContract(contractAddress: string, msg: Record<string, any>, fee: StdFee | 'auto' | number, memo?: string, funds?: Coin[]): Promise<ExecuteResult> {
        if (!this.address) {
            throw new Error('Sender address is missing');
        }
        return this.execute(this.address, contractAddress, msg, fee, memo, funds);
    }

    public async executeContractSubMsg(contractData: ContractData[], fee: StdFee | 'auto' | number, memo?: string, funds?: Coin[]): Promise<ExecuteResult> {
        if (!this.address) {
            throw new Error('Sender address is missing');
        }

        const executeContractMsg: EncodeObject[] = contractData.map((contractData) => {
            return {
                typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                value: MsgExecuteContract.fromPartial({
                    sender: this.address,
                    contract: contractData.contractAddress,
                    msg: toUtf8(JSON.stringify(contractData.msg)),
                    funds: [...(funds || [])],
                }),
            };
        });
        const result = await this.signAndBroadcast(this.address, executeContractMsg, fee, memo);
        if (isDeliverTxFailure(result)) {
            throw new Error(this.createDeliverTxResponseErrorMessage(result));
        }
        return {
            logs: stargate_1.logs.parseRawLog(result.rawLog),
            height: result.height,
            transactionHash: result.transactionHash,
            gasWanted: result.gasWanted,
            gasUsed: result.gasUsed,
        };
    }

    private createDeliverTxResponseErrorMessage(result: DeliverTxResponse) {
        return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
    }
}
