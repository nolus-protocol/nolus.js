import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { GasPrice, createBankAminoConverters, createStakingAminoConverters, createDistributionAminoConverters } from '@cosmjs/stargate';
import { NolusClient } from '../client';
import { NolusWallet } from './NolusWallet';
import { ChainConstants } from '../constants/';
import { LedgerSigner } from '@cosmjs/ledger-amino';
import { AminoTypes } from '@cosmjs/stargate';
import { createWasmAminoConverters } from '@cosmjs/cosmwasm-stargate';
import { createIbcAminoConverters } from './aminomessages';

const aminoTypes: any = {
    ...createIbcAminoConverters(),
    ...createBankAminoConverters(),
    ...createStakingAminoConverters(),
    ...createDistributionAminoConverters(),
    ...createWasmAminoConverters(),
};

const MsgTransferAmino = new AminoTypes(aminoTypes) as any;

export const nolusOfflineSigner = async (offlineDirectSigner: OfflineDirectSigner): Promise<NolusWallet> => {
    const tendermintClient = await NolusClient.getInstance().getTendermintClient();
    const price = GasPrice.fromString(ChainConstants.GAS_PRICE);
    return new NolusWallet(tendermintClient, offlineDirectSigner, { aminoTypes: MsgTransferAmino, gasPrice: price });
};

export const nolusLedgerWallet = async (ledgerSigner: LedgerSigner): Promise<NolusWallet> => {
    const tendermintClient = await NolusClient.getInstance().getTendermintClient();
    return new NolusWallet(tendermintClient, ledgerSigner, { aminoTypes: MsgTransferAmino });
};

export { aminoTypes };
