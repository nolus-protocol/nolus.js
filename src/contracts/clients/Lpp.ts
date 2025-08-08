import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import {
    burnMsg,
    claimRewardsMsg,
    distributeRewardsMsg,
    getLenderDepositMsg,
    getLenderRewardsMsg,
    getLoanInformationMsg,
    getLppBalanceMsg,
    getDepositCapacityMsg,
    getLppConfigMsg,
    getPriceMsg,
    depositMsg,
    getLPNMsg,
    getStableBalanceMsg,
} from '../messages';
import { Balance, LoanInfo, LppBalance, LppConfig, Price, Rewards, DepositCapacity } from '../types';

/**
 * The Liquidity Provider Pool (LPP) is a smart contract responsible for managing lending and borrowing activity within a specific currency on the Nolus Protocol.
 * Key characteristics:
 * - One LPP instance per currency (e.g. USDC, ATOM), handling both deposits and borrow requests in that asset.
 * - Accepts single-sided deposits from users (no LP token pairing required).
 * - Issues loans for opening margin positions via the Leaser module.
 * - Accumulates interest from borrowers and periodically receives rewards from the Treasury contract.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * lppInstance = new NolusContracts.Lpp(cosm, lppContractAddress);
 * ```
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Lpp {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    /**
    * Retrieves loan details for a given margin position (lease) contract.
    *
    * @param leaseAddress - The address of the lease (margin position) contract.
    * @returns A `Promise` resolving to a `LoanInfo` object containing the loan state.
    * The returned data includes:
    * - Outstanding principal amount still owed by the position.
    * - The fixed annual interest rate for the loan (in permilles).
    * - The latest interest settlement date in unix
    */
    public async getLoanInformation(leaseAddress: string): Promise<LoanInfo> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLoanInformationMsg(leaseAddress));
    }

    /**
    * Retrieves the current liquidity and debt statistics of the LPP.
    *
    * @returns A `Promise` resolving to an object containing:
    * - Available pool balance (unloaned funds).
    * - Total borrowed principal across all active loans for the corresponding market.
    * - Accrued interest owed by all borrowers.
    * - Total amount of receipt tokens (`nlpn`) issued to depositors.
    */
    public async getLppBalance(): Promise<LppBalance> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLppBalanceMsg());
    }

    /**
    * Retrieves the total LPP balance (available funds + borrowed principal + interest due),
    * priced into a stablecoin equivalent using the given oracle.
    *
    * @param oracleAddress - The address of the price oracle contract.
    *
    * @returns A `Promise` resolving to:
    * - The total pool value expressed as the sum of available liquidity, borrowed liquidity and interest owed in stablecoin units (as a number).
    */
    public async getStableBalance(oracleAddress: string): Promise<number> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getStableBalanceMsg(oracleAddress));
    }
    
    /**
    * Retrieves the remaining deposit capacity for the LPP based on a minimum utilization threshold parameter defined.
    *
    * @returns A `Promise` resolving to:
    * - The available amount that can still be deposited into the pool.
    */
    public async getDepositCapacity(): Promise<DepositCapacity | null> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getDepositCapacityMsg());
    }

    /**
    * Retrieves the configuration parameters of the LPP, including the borrow rate model.
    *
    * @returns A `Promise` resolving to:
    * - The base interest rate in permilles.
    * - The optimal utilization threshold in permilles.
    * - The interest rate slope (add-on interest rate).
    * - The minimum utilization threshold in permilles, below which new deposits are disallowed.
    */
    public async getLppConfig(): Promise<LppConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLppConfigMsg());
    }

    /**
    * Retrieves the native asset (LPN) used by this LPP instance.
    *
    * @returns A `Promise` resolving to:
    * - The ticker of the pool's native asset (e.g. "USDC_NOBLE").
    */
    public async getLPN(): Promise<string> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLPNMsg());
    }

    /**
    * Retrieves the current price of the receipt token (`nLPN`) relative to the pool's native asset.
    *
    * @returns A `Promise` resolving to:
    * - The current pool asset amount backing the total issued nLPN tokens.
    * - The equivalent value in stablecoin terms.
    */
    public async getPrice(): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPriceMsg());
    }

    /**
    * Retrieves the additional incentive rewards (in NLS) accumulated by a specific lender.
    *
    * @param lenderAddress - The bech32 wallet address of the lender.
    *
    * @returns A `Promise` resolving to:
    * - The amount of claimable rewards in NLS (as a string in micro-units).
    */
    public async getLenderRewards(lenderAddress: string): Promise<Rewards> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderRewardsMsg(lenderAddress));
    }

    /**
    * Retrieves the current deposit balance for a specific lender, expressed in receipt tokens (`nLPN`).
    *
    * @param lenderAddress - The bech32 wallet address of the lender.
    *
    * @returns A `Promise` resolving to:
    * - The lender’s deposit amount in `nLPN` (as a string in micro-units).
    */
    public async getLenderDeposit(lenderAddress: string): Promise<Balance> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLenderDepositMsg(lenderAddress));
    }

    /**
    * Executes a transaction to claim any accumulated NLS incentive rewards.
    * 
    * The rewards can be claimed to the user's own address or to another recipient.
    *
    * @param nolusWallet - The user's wallet instance.
    * @param recipientAddress - Optional. The address to send the claimed NLS rewards to.
    * @param fee - The gas fee for the transaction.
    * @param fundCoin - Optional. Additional coins for funding the fee.
    *
    * @returns A `Promise` resolving to:
    * - The execution result including gas used, transaction hash, and events.
    */
    public async claimRewards(nolusWallet: NolusWallet, recipientAddress: string | undefined, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, claimRewardsMsg(recipientAddress), fee, undefined, fundCoin);
    }

    /**
    * Simulates the transaction for claiming accumulated NLS rewards, without broadcasting it.
    *
    * @param nolusWallet - The user's wallet instance.
    * @param recipientAddress - Optional. The address to simulate sending rewards to.
    * @param fundCoin - Optional. Coins to simulate as the fee source.
    *
    * @returns A `Promise` resolving to:
    * - The simulated transaction result including gas estimate and fee.
    */
    public async simulateClaimRewardsTx(nolusWallet: NolusWallet, recipientAddress: string | undefined, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, claimRewardsMsg(recipientAddress), fundCoin);
    }

    /**
    * Executes a deposit into the LPP using the native asset (LPN).
    *
    * The user receives nLPN receipt tokens in return, representing their share in the pool.
    *
    * @param nolusWallet - The user's wallet instance.
    * @param fee - The gas fee for the transaction.
    * @param fundCoin - The amount and denomination of LPN to deposit.
    *
    * @returns A `Promise` resolving to:
    * - The execution result including gas used, transaction hash, and events.
    */
    public async deposit(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, depositMsg(), fee, undefined, fundCoin);
    }

    /**
    * Simulates a deposit into the LPP using the specified LPN amount.
    *
    * @param nolusWallet - The user's wallet instance.
    * @param fundCoin - The simulated deposit amount.
    *
    * @returns A `Promise` resolving to:
    * - The simulated transaction result including gas estimate and fee.
    */
    public async simulateDepositTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, depositMsg(), fundCoin);
    }

    /**
    * Executes a transaction that distributes NLS incentives into the LPP reward pool.
    *
    * This function is typically called by authorized entities (e.g. Treasury).
    *
    * @param nolusWallet - The wallet instance executing the distribution.
    * @param fee - The gas fee for the transaction.
    * @param fundCoin - The amount of NLS to distribute.
    *
    * @returns A `Promise` resolving to:
    * - The execution result including gas used, transaction hash, and events.
    */
    public async distributeRewards(nolusWallet: NolusWallet, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, distributeRewardsMsg(), fee, undefined, fundCoin);
    }

    /**
    * Simulates the distribution of NLS rewards into the LPP pool.
    *
    * @param nolusWallet - The wallet instance.
    * @param fundCoin - The simulated NLS reward distribution amount.
    *
    * @returns A `Promise` resolving to:
    * - The simulated transaction result including gas estimate and fee.
    */
    public async simulateDistributeRewardsTx(nolusWallet: NolusWallet, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, distributeRewardsMsg(), fundCoin);
    }

    /**
    * Executes a withdrawal from the LPP by burning nLPN receipt tokens.
    *
    * The user receives back the equivalent amount of LPN based on the current receipt price.
    *
    * @param nolusWallet - The user's wallet instance.
    * @param burnAmount - The amount of nLPN to burn (in micro-units).
    * @param fee - The gas fee for the transaction.
    * @param fundCoin - Optional. Additional coins to fund the transaction.
    *
    * @returns A `Promise` resolving to:
    * - The execution result including gas used, transaction hash, and events.
    */
    public async burnDeposit(nolusWallet: NolusWallet, burnAmount: string, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, burnMsg(burnAmount), fee, undefined, fundCoin);
    }

    /**
    * Simulates a withdrawal from the LPP by burning nLPN receipt tokens.
    *
    * @param nolusWallet - The user's wallet instance.
    * @param burnAmount - The simulated amount of nLPN to burn.
    * @param fundCoin - Optional. Coins to simulate as the fee source.
    *
    * @returns A `Promise` resolving to:
    * - The simulated transaction result including gas estimate and fee.
    */
    public async simulateBurnDepositTx(nolusWallet: NolusWallet, burnAmount: string, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, burnMsg(burnAmount), fundCoin);
    }
}
