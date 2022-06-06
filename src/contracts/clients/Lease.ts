import { LeaseApply, LeaserConfig } from '../types';
import { NolusClient } from '../../client';
import { getCurrentOpenLeases, getLeaserConfigMsg, getLeaseStatus, getLoanInformationMsg, makeLeaseApply, openLease, repayLease, setLeaserConfigMsg } from '../messages';
import { NolusWallet } from '../../wallet/NolusWallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { LoanInfo } from '../types/LoanInfo';

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

    public async getLeaserConfig(contractAddress: string): Promise<LeaserConfig> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getLeaserConfigMsg());
    }

    public async getLoanInformation(contractAddress: string, leaseAddress: string): Promise<LoanInfo> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getLoanInformationMsg(leaseAddress));
    }

    public async openLease(contractAddress: string, nolusWallet: NolusWallet, leaseDenom: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, openLease(leaseDenom), fee, undefined, fundCoin);
    }

    public async repayLease(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, repayLease(), fee, undefined, fundCoin);
    }

    public async setLeaserConfig(contractAddress: string, nolusWallet: NolusWallet, leaserConfig: LeaserConfig, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.еxecuteContract(contractAddress, setLeaserConfigMsg(leaserConfig), fee, undefined, fundCoin);
    }
}
