import stargate, { DeliverTxResponse, isDeliverTxFailure, StdFee, calculateFee } from '@cosmjs/stargate';
import { SigningCosmWasmClient, SigningCosmWasmClientOptions } from '@cosmjs/cosmwasm-stargate';
import { Coin, EncodeObject, OfflineSigner } from '@cosmjs/proto-signing';
import { CometClient } from '@cosmjs/tendermint-rpc';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { toUtf8, toHex } from '@cosmjs/encoding';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { ContractData } from '../contracts/types/ContractData';
import { encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { ChainConstants } from '../constants';
import { sha256 } from '@cosmjs/crypto';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgDelegate, MsgUndelegate } from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import { MsgWithdrawDelegatorReward } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import { QuerySmartContractStateRequest } from 'cosmjs-types/cosmwasm/wasm/v1/query';
import { claimRewardsMsg, getLenderRewardsMsg } from '../contracts';
import { MsgVote } from 'cosmjs-types/cosmos/gov/v1beta1/tx';

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

    constructor(tmClient: CometClient | undefined | any, signer: OfflineSigner, options: SigningCosmWasmClientOptions) {
        super(tmClient, signer, options);
        this.offlineSigner = signer;
    }

    getOfflineSigner() {
        return this.offlineSigner;
    }

    async simulateTx(msg: MsgSend | MsgExecuteContract | MsgTransfer | MsgDelegate | MsgUndelegate | MsgVote, msgTypeUrl: string, memo = '') {
        const pubkey = encodeSecp256k1Pubkey(this.pubKey as Uint8Array);
        const msgAny = {
            typeUrl: msgTypeUrl,
            value: msg,
        };

        const sequence = await this.sequence();
        const { gasInfo } = await this.forceGetQueryClient().tx.simulate([this.registry.encodeAsAny(msgAny)], memo, pubkey, sequence);
        const gas = Number(gasInfo?.gasUsed ?? 0) * ChainConstants.GAS_MULTIPLIER;
        const usedFee = calculateFee(gas, ChainConstants.GAS_PRICE);
        const txRaw = await this.sign(this.address as string, [msgAny], usedFee, memo);

        const txBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
        const txHash = toHex(sha256(txBytes));

        return {
            txHash,
            txBytes,
            usedFee,
        };
    }

    private async simulateMultiTx(messages: { msg: MsgSend | MsgExecuteContract | MsgTransfer | MsgDelegate | MsgUndelegate | MsgWithdrawDelegatorReward; msgTypeUrl: string }[], memo = '') {
        const pubkey = encodeSecp256k1Pubkey(this.pubKey as Uint8Array);
        const encodedMSGS = [];
        const msgs = [];

        for (const item of messages) {
            const msgAny = {
                typeUrl: item.msgTypeUrl,
                value: item.msg,
            };
            encodedMSGS.push(this.registry.encodeAsAny(msgAny));
            msgs.push(msgAny);
        }

        const sequence = await this.sequence();
        const { gasInfo } = await this.forceGetQueryClient().tx.simulate(encodedMSGS, memo, pubkey, sequence);

        const gas = Number(gasInfo?.gasUsed ?? 0) * ChainConstants.GAS_MULTIPLIER;
        const usedFee = calculateFee(gas, ChainConstants.GAS_PRICE);
        const txRaw = await this.sign(this.address as string, msgs, usedFee, memo);

        const txBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
        const txHash = toHex(sha256(txBytes));

        return {
            txHash,
            txBytes,
            usedFee,
        };
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
            logs: stargate.logs.parseRawLog(result.rawLog),
            height: result.height,
            transactionHash: result.transactionHash,
            gasWanted: result.gasWanted,
            gasUsed: result.gasUsed,
            events: [],
        };
    }

    /**
     * Usage:
     *
     * ```ts
     * const amount = coin(1, 'unls');
     * const {
     *     txHash,
     *     txBytes,
     *     usedFee
     * } = await wallet.simulateBankTransferTx('nolusAddress', [amount]);
     * const item = await wallet.broadcastTx(txBytes);
     *```
     */
    public async simulateBankTransferTx(toAddress: string, amount: Coin[]) {
        const msg = MsgSend.fromPartial({
            fromAddress: this.address,
            toAddress,
            amount,
        });

        return await this.simulateTx(msg, '/cosmos.bank.v1beta1.MsgSend');
    }

    /**
     * Usage:
     *
     * ```ts
     * const downpayment = coin(1, 'ibc/....');
     * const msg = {
     *  open_lease: {
     *      currency: 'OSMO',
     *  },
     * };
     * const {
     *     txHash,
     *     txBytes,
     *     usedFee
     * } = await wallet.simulateExecuteContractTx('leaserAddress', msg, [downpayment]);
     * const item = await wallet.broadcastTx(txBytes);
     * ```
     */
    public async simulateExecuteContractTx(contract: string, msgData: Record<string, any>, funds: Coin[] = []) {
        const msg = MsgExecuteContract.fromPartial({
            sender: this.address,
            contract,
            msg: toUtf8(JSON.stringify(msgData)),
            funds,
        });

        return await this.simulateTx(msg, '/cosmwasm.wasm.v1.MsgExecuteContract');
    }

    public async simulateSendIbcTokensTx({ toAddress, amount, sourcePort, sourceChannel, memo = '' }: { toAddress: string; amount: Coin; sourcePort: string; sourceChannel: string; memo?: string }) {
        const timeOut = Math.floor(Date.now() / 1000) + ChainConstants.IBC_TRANSFER_TIMEOUT;
        const longTimeOut = BigInt(timeOut) * BigInt(1_000_000_000);

        const msg = MsgTransfer.fromPartial({
            sourcePort,
            sourceChannel,
            sender: this.address?.toString(),
            receiver: toAddress,
            token: amount,
            timeoutHeight: undefined,
            timeoutTimestamp: longTimeOut,
            memo,
        });

        return await this.simulateTx(msg, '/ibc.applications.transfer.v1.MsgTransfer', '');
    }

    public async simulateDelegateTx(data: { validator: string; amount: Coin }[]) {
        const msgs = [];

        for (const item of data) {
            const msg = MsgDelegate.fromPartial({
                validatorAddress: item.validator,
                delegatorAddress: this.address,
                amount: item.amount,
            });
            msgs.push({
                msg: msg,
                msgTypeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
            });
        }

        return await this.simulateMultiTx(msgs, '');
    }

    public async simulateUndelegateTx(data: { validator: string; amount: Coin }[]) {
        const msgs = [];

        for (const item of data) {
            const msg = MsgUndelegate.fromPartial({
                validatorAddress: item.validator,
                delegatorAddress: this.address,
                amount: item.amount,
            });
            msgs.push({
                msg: msg,
                msgTypeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
            });
        }

        return await this.simulateMultiTx(msgs, '');
    }

    public async simulateWithdrawRewardTx(data: { validator: string; delegator: string }[]) {
        const msgs = [];

        for (const item of data) {
            const msg = MsgWithdrawDelegatorReward.fromPartial({
                validatorAddress: item.validator,
                delegatorAddress: this.address,
            });

            msgs.push({
                msg: msg,
                msgTypeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
            });
        }

        return await this.simulateMultiTx(msgs, '');
    }

    public async simulateClaimRewards(data: { validator: string; delegator: string }[], lppContracts: string[]) {
        const msgs = [];

        for (const item of data) {
            const msg = MsgWithdrawDelegatorReward.fromPartial({
                validatorAddress: item.validator,
                delegatorAddress: this.address,
            });

            msgs.push({
                msg: msg,
                msgTypeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
            });
        }

        for (let lppContract of lppContracts) {
            try {
                const item = await this.queryContractSmart(lppContract, getLenderRewardsMsg(this.address as string));
                if (Number(item.rewards.amount) > 0) {
                    const msg = MsgExecuteContract.fromPartial({
                        sender: this.address,
                        contract: lppContract,
                        msg: toUtf8(JSON.stringify(claimRewardsMsg(this.address))),
                    });

                    msgs.push({
                        msg: msg,
                        msgTypeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
                    });
                }
            } catch (error) {
                console.log(error);
            }
        }

        return await this.simulateMultiTx(msgs, '');
    }

    private async sequence() {
        try {
            const { sequence } = await this.getSequence(this.address as string);
            return sequence;
        } catch (error) {
            throw new Error('Insufficient amount of NLS');
        }
    }

    private createDeliverTxResponseErrorMessage(result: DeliverTxResponse) {
        return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
    }

    public async querySmartContract(contract: string, msg: object, height?: number) {
        const data = QuerySmartContractStateRequest.encode({
            address: contract,
            queryData: toUtf8(JSON.stringify(msg)),
        }).finish();

        const query: {
            path: string;
            data: Uint8Array;
            prove: boolean;
            height?: number;
        } = {
            path: '/cosmwasm.wasm.v1.Query/SmartContractState',
            data,
            prove: true,
        };

        if ((height as number) > 0) {
            query.height = height;
        }

        const client = this.getCometClient();

        if (!client) {
            throw 'Tendermint client not initialized';
        }

        const response = await client.abciQuery(query);
        return QuerySmartContractStateRequest.decode(response.value);
    }
}
