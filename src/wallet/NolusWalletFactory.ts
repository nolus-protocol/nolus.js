import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { createIbcAminoConverters, GasPrice, createBankAminoConverters, createStakingAminoConverters, createDistributionAminoConverters } from '@cosmjs/stargate';
import { NolusClient } from '../client';
import { NolusWallet } from './NolusWallet';
import { ChainConstants } from '../constants/';
import { LedgerSigner } from '@cosmjs/ledger-amino';
import { AminoTypes } from "@cosmjs/stargate";
import { createWasmAminoConverters } from '@cosmjs/cosmwasm-stargate';

const aminoTypes = {
    ...createIbcAminoConverters(),
    ...createBankAminoConverters(),
    ...createStakingAminoConverters(ChainConstants.BECH32_PREFIX_ACC_ADDR),
    ...createDistributionAminoConverters(),
    ...createWasmAminoConverters()
}

const MsgTransferAmino = new AminoTypes(aminoTypes);

export const nolusOfflineSigner = async (offlineDirectSigner: OfflineDirectSigner): Promise<NolusWallet> => {
    const tendermintClient = await NolusClient.getInstance().getTendermintClient();
    const price = GasPrice.fromString(ChainConstants.GAS_PRICE);
    return new NolusWallet(tendermintClient, offlineDirectSigner, { prefix: ChainConstants.BECH32_PREFIX_ACC_ADDR, aminoTypes: MsgTransferAmino, gasPrice: price });
};

export const nolusLedgerWallet = async (ledgerSigner: LedgerSigner): Promise<NolusWallet> => {
    const tendermintClient = await NolusClient.getInstance().getTendermintClient();
    return new NolusWallet(tendermintClient, ledgerSigner, { prefix: ChainConstants.BECH32_PREFIX_ACC_ADDR, aminoTypes: MsgTransferAmino });
};

export { aminoTypes };