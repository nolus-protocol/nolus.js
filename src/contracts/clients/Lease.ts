import { LeaseApply } from '../types';
import { NolusClient } from '../../client';
import { getCurrentOpenLeases, getLeaseStatus, makeLeaseApply, openLease, repayLease } from '../messages';
import { NolusWallet } from '../../wallet/NolusWallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';

export class Lease {
    public async makeLeaseApply(contractAddress: string, amount: string, denom: string): Promise<LeaseApply> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, makeLeaseApply(amount, denom));
    }

    public async getCurrentOpenLeases(contractAddress: string, ownerAddress: string) {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getCurrentOpenLeases(ownerAddress));
    }

    public async getLeaseStatus(contractAddress: string) {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getLeaseStatus());
    }

    public async openLease(
        contractAddress: string,
        nolusWallet: NolusWallet,
        leaseDenom: string,
        fee: StdFee | 'auto' | number = {
            amount: [
                {
                    denom: 'unolus',
                    amount: '0.0025',
                },
            ],
            gas: '100000',
        },
        fundCoin?: Coin[],
    ): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, openLease(leaseDenom), fee, undefined, fundCoin);
    }

    public async repayLease(
        contractAddress: string,
        nolusWallet: NolusWallet,
        fee: StdFee | 'auto' | number = {
            amount: [
                {
                    denom: 'unolus',
                    amount: '0.0025',
                },
            ],
            gas: '100000',
        },
        fundCoin?: Coin[],
    ): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, repayLease(), fee, undefined, fundCoin);
    }
}
