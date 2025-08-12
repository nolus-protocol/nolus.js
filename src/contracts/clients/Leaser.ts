import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { LeaseApply, LeaserConfig } from '../types';
import { getCurrentOpenLeasesByOwnerMsg, getLeaserConfigMsg, leaseQuoteMsg, openLeaseMsg } from '../messages';
import { NolusWallet } from '../../wallet';
import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';

/**
 * A customer-facing smart contract keeping a register of customer's Lease instances.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * leaserInstance = new NolusContracts.Leaser(cosm, leaserContractAddress);
 * ```
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Leaser {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    /**
     * Queries the smart contract to calculate a lease quote based on the user’s input parameters.
     *
     * This function returns an estimate for a leveraged position, including the amount borrowed,
     * the total position size, and the applicable interest rates for both lenders and the protocol.
     *
     * The values are expressed in micro-units (e.g. "15000000" = 15.0 tokens), and asset decimal precision
     * may vary depending on the asset (e.g. 6 decimals for USDC/OSMO, 8 for ALL_BTC, 9 for ALL_SOL).
     *
     * @param downpaymentAmount - The initial down payment (collateral) provided by the user, in micro-units (e.g. "15000000" = 15 USDC).
     * @param downpaymentCurrency - The denomination of the collateral asset (e.g. "USDC").
     * @param leaseAsset - The asset to be acquired via leverage (e.g. "OSMO", "ALL_BTC", etc.).
     * @param max_ltd - Optional. Maximum loan-to-downpayment ratio (LTD), in permilles (e.g. 1500 = 150%). Defaults to 1500.
     *
     * @returns A `Promise` resolving to a `LeaseApply` object containing:
     * - `total.amount`: Estimated total position size in micro-units of the lease asset.
     * - `total.ticker`: Ticker symbol of the leased asset (e.g. "OSMO").
     * - `borrow.amount`: Amount borrowed in micro-units of the debt asset.
     * - `borrow.ticker`: Ticker symbol of the borrowed (debt) asset (e.g. "USDC_NOBLE").
     * - `annual_interest_rate`: Annual interest rate paid to lenders (in basis points, e.g. 128 = 12.8%).
     * - `annual_interest_rate_margin`: Protocol's share of interest (in permilles, e.g. 80 = 8%).
     */
    public async leaseQuote(downpaymentAmount: string, downpaymentCurrency: string, leaseAsset: string, max_ltd?: number): Promise<LeaseApply> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, leaseQuoteMsg(downpaymentAmount, downpaymentCurrency, leaseAsset, max_ltd));
    }

    /**
     * Queries the smart contract for all currently active margin positions (leases)
     * opened by the specified wallet address.
     *
     * Each returned address corresponds to a distinct Nolus smart contract instance
     * that manages an individual active leverage position for the user.
     *
     * If the user has no active positions, an empty array is returned.
     *
     * @param ownerAddress - The bech32 wallet address of the user (e.g. "nolus1...").
     *
     * @returns A `Promise` resolving to an array of Nolus contract addresses, where:
     * - Each item represents an active leverage position (lease contract) opened by the user.
     * - An empty array (`[]`) is returned if no active positions exist.
     */
    public async getCurrentOpenLeasesByOwner(ownerAddress: string): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrentOpenLeasesByOwnerMsg(ownerAddress));
    }

    /**
     * Retrieves the global configuration parameters from the leaser contract.
     *
     * The configuration includes:
     * - Liability thresholds for leveraged positions, defined in permilles:
     *   - `initial`: maximum allowed at position creation
     *   - `healthy`: target level for a safe position after a partial liquidation has been executed
     *   - `max`: liquidation threshold
     * - Protocol interest rate defined as margin interest, in permilles.
     * - Minimum required asset and transaction amounts.
     * - IBC channel information for DEX operations (e.g. Nolus ↔ Osmosis connection).
     *
     * All values are contract-defined and subject to on-chain governance or upgrades.
     *
     * @returns A `Promise` resolving to a `LeaserConfig` object with the core configuration parameters.
     */
    public async getLeaserConfig(): Promise<LeaserConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getLeaserConfigMsg());
    }

    /**
     * Executes a transaction to open a new leveraged position (lease) for the specified user wallet.
     *
     * The user must provide the target asset to be acquired via leverage (e.g. "ATOM"),
     * the gas fee for the transaction, and the collateral to be used (as `fundCoin[]`).
     *
     * Optionally, a custom maximum loan-to-downpayment ratio (LTD) can be specified in permilles, important for the leverage.
     *
     * The `fundCoin` should contain the down payment (collateral) in the appropriate IBC denomination
     * (e.g. "ibc/..." for Noble USDC on Nolus transferred from Osmosis via IBC). If omitted, the transaction will fail.
     *
     * @param nolusWallet - The user's connected wallet.
     * @param leaseCurrency - The asset to be acquired via leverage (e.g. "ATOM").
     * @param fee - The transaction fee (can be a `StdFee` object, `auto`, or a numeric gas estimate).
     * @param max_ltd - Optional maximum loan-to-downpayment ratio in permilles (default is 1500 which corresponds to 2.5x of leverage).
     * @param fundCoin - The provided collateral amount as an array of `Coin` objects, typically 1 element.
     *
     * @returns A `Promise` resolving to an `ExecuteResult` object, containing:
     * - `transactionHash`: The tx hash on chain.
     * - `gasUsed` and `gasWanted`: Actual and provided gas usage.
     * - `height`: The block height the tx was included in.
     * - `events`: A detailed list of emitted events.
     */
    public async openLease(nolusWallet: NolusWallet, leaseCurrency: string, fee: StdFee | 'auto' | number, max_ltd?: number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, openLeaseMsg(leaseCurrency, max_ltd), fee, undefined, fundCoin);
    }

    /**
     * Simulates the transaction to open a leveraged position, without broadcasting it to the chain.
     *
     * Accepts the same parameters as `openLease`, including the desired asset (`leaseCurrency`),
     * optional max LTD, and the provided down payment (collateral) (`fundCoin`).
     *
     * Useful for gas estimation or frontend validation before submitting the actual transaction.
     *
     * @param nolusWallet - The user's connected wallet instance.
     * @param leaseCurrency - The asset to be acquired via leverage (e.g. "ATOM").
     * @param max_ltd - Optional maximum loan-to-downpayment ratio in permilles (default is 1500).
     * @param fundCoin - The collateral amount as an array of `Coin` objects, typically 1 element.
     *
     * @returns A `Promise` resolving to a simulation result object containing:
     * - `txHash`: The simulated transaction hash.
     * - `usedFee`: The estimated fee, including:
     *   - `amount`: Fee amount in denom units.
     *   - `gas`: Estimated gas units needed for the operation.
     */
    public async simulateOpenLeaseTx(nolusWallet: NolusWallet, leaseCurrency: string, max_ltd?: number, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, openLeaseMsg(leaseCurrency, max_ltd), fundCoin);
    }
}
