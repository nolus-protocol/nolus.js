import { SigningCosmWasmClient, SigningCosmWasmClientOptions } from '@cosmjs/cosmwasm-stargate';
import { Coin, OfflineSigner } from '@cosmjs/proto-signing';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { DeliverTxResponse, StdFee } from '@cosmjs/stargate';

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

    public async transferAmount(
        receiverAddress: string,
        amount: Coin[],
        fee: StdFee | 'auto' | number = {
            amount: [
                {
                    denom: 'unolus',
                    amount: '0.0025',
                },
            ],
            gas: '100000',
        },
        memo: string,
    ): Promise<DeliverTxResponse> {
        if (!this.address) {
            throw new Error('Sender address is missing');
        }
        return this.sendTokens(this.address, receiverAddress, amount, fee, memo);
    }
}
