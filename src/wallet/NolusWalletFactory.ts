import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';
import { NolusClient } from '../client';
import { NolusWallet } from './NolusWallet';
import { ChainConstants } from '../constants/';
import { LedgerSigner } from '@cosmjs/ledger-amino';

export const nolusOfflineSigner = async (offlineDirectSigner: OfflineDirectSigner): Promise<NolusWallet> => {
    const tendermintClient = await NolusClient.getInstance().getTendermintClient();
    const price = GasPrice.fromString(ChainConstants.GAS_PRICE);
    return new NolusWallet(tendermintClient, offlineDirectSigner, { prefix: ChainConstants.BECH32_PREFIX_ACC_ADDR, gasPrice: price });
};

export const nolusLedgerWallet = async (ledgerSigner: LedgerSigner): Promise<NolusWallet> => {
    const tendermintClient = await NolusClient.getInstance().getTendermintClient();
    return new NolusWallet(tendermintClient, ledgerSigner, { prefix: ChainConstants.BECH32_PREFIX_ACC_ADDR });
};
