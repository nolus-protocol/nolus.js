import { LeaseApply, LeaserConfig, LoanInfo } from '../types';
import { NolusClient } from '../../client';
import { closeLeaseMsg, getCurrentOpenLeasesMsg, getLeaserConfigMsg, getLeaseStatusMsg, getLoanInformationMsg, makeLeaseApplyMsg, openLeaseMsg, repayLeaseMsg, setLeaserConfigMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { LeaseStatus } from '../types/LeaseStatus';

export class Lease {
    public async makeLeaseApply(contractAddress: string, amount: string, denom: string): Promise<LeaseApply> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, makeLeaseApplyMsg(amount, denom));
    }

    public async getCurrentOpenLeases(contractAddress: string, ownerAddress: string): Promise<string[]> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getCurrentOpenLeasesMsg(ownerAddress));
    }

    public async getLeaseStatus(contractAddress: string): Promise<LeaseStatus> {
        const cosm = await NolusClient.getInstance().getCosmWasmClient();
        return await cosm.queryContractSmart(contractAddress, getLeaseStatusMsg());
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
        return nolusWallet.executeContract(contractAddress, openLeaseMsg(leaseDenom), fee, undefined, fundCoin);
    }

    public async repayLease(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, repayLeaseMsg(), fee, undefined, fundCoin);
    }

    public async closeLease(contractAddress: string, nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, closeLeaseMsg(), fee, undefined, fundCoin);
    }

    public async setLeaserConfig(contractAddress: string, nolusWallet: NolusWallet, leaserConfig: LeaserConfig, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(contractAddress, setLeaserConfigMsg(leaserConfig), fee, undefined, fundCoin);
    }
}
