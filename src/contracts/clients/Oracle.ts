import { StdFee } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate/build/signingcosmwasmclient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Price } from '../types';
import {
    feedPricesMsg,
    getConfigMsg,
    getFeedersMsg,
    getBasePriceMsg,
    getPricesMsg,
    getCurrencyPairsMsg,
    getSwapPathMsg,
    isFeederMsg,
    getSwapTreeMsg,
    getCurrenciesMsg,
    getBaseCurrencyMsg,
    getStableCurrencyMsg,
    getStablePriceMsg,
} from '../messages';
import { NolusWallet } from '../../wallet';
import { FeedPrices } from '../types/FeedPrices';
import { OracleConfig } from '../types/OracleConfig';
import { SwapPath } from '../types/SwapPath';
import { SwapTree } from '../types/SwapTree';
import { CurrencyInfo } from '../types/CurrencyInfo';

/**
 * An on-chain oracle providing market data prices to the rest of the system.
 *
 * Usage:
 *
 * ```ts
 * import { NolusClient, NolusContracts } from '@nolus/nolusjs';
 *
 * const cosm = await NolusClient.getInstance().getCosmWasmClient();
 * oracleInstance = new NolusContracts.Oracle(cosm, oracleContractAddress);
 * ```
 *
 * There are also methods for simulating contract operations in order to obtain preliminary information about the transaction.
 */
export class Oracle {
    private cosmWasmClient!: CosmWasmClient;
    private _contractAddress: string;

    constructor(cosmWasmClient: CosmWasmClient, contractAddress: string) {
        this.cosmWasmClient = cosmWasmClient;
        this._contractAddress = contractAddress;
    }

    /**
    * Retrieves the configured base currency used by the Oracle for expressing all price values.
    *
    * @returns A `Promise` resolving to:
    * - The base currency ticker (e.g. "USDC_NOBLE").
    */
    public async getBaseCurrency(): Promise<string> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getBaseCurrencyMsg());
    }

    /**
    * Retrieves the stable currency used for stable price conversions and display.
    *
    * @returns A `Promise` resolving to:
    * - The stable currency ticker (e.g. "USDC_NOBLE").
    */
    public async getStableCurrency(): Promise<string> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getStableCurrencyMsg());
    }

    /**
    * Retrieves the full set of known asset prices from the Oracle.
    *
    * @returns A `Promise` resolving to:
    * - A mapping of asset tickers to their respective price data, including:
    *   - The asset amount (`amount`)
    *   - Its quoted value in the base currency (`amount_quote`)
    */
    public async getPrices(): Promise<{ [key: string]: Price }> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getPricesMsg());
    }

    /**
    * Retrieves the current price of a given asset relative to the base currency.
    *
    * @param currency - The asset ticker to fetch the price for (e.g. "ATOM", "NLS").
    *
    * @returns A `Promise` resolving to:
    * - The asset price expressed in base currency units.
    */
    public async getBasePrice(currency: string): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getBasePriceMsg(currency));
    }

    /**
    * Retrieves the current price of a given asset relative to the stable currency.
    *
    * @param currency - The asset ticker to fetch the stable price for.
    *
    * @returns A `Promise` resolving to:
    * - The asset price expressed in stable currency units.
    */
    public async getStablePrice(currency: string): Promise<Price> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getStablePriceMsg(currency));
    }

    /**
    * Retrieves the intermediary swap pairs used by the Oracle to construct pricing paths.
    *
    * Each pair defines a route between two assets and their Oracle source ID.
    *
    * @returns A `Promise` resolving to:
    * - An array of tuples: [asset_ticker, [oracle_id, intermediate_ticker]]
    */
    public async getCurrencyPairs(): Promise<[string, [number, string]][]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrencyPairsMsg());
    }

    /**
    * Retrieves all supported currencies and their associated metadata.
    *
    * @returns A `Promise` resolving to:
    * - An array of currency definitions, each containing:
    *   - `ticker`: The currency ticker
    *   - `bank_symbol` and `dex_symbol`: On-chain denominations
    *   - `decimal_digits`: Decimal precision
    *   - `group`: Logical group such as "lpn", "lease", or "native"
    */
    public async getCurrencies(): Promise<CurrencyInfo[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getCurrenciesMsg());
    }

    /**
    * Retrieves the swap path between two assets as defined by the Oracle.
    *
    * This is useful for building multi-hop pricing routes or swap logic.
    *
    * @param fromCurrency - The source asset ticker.
    * @param toCurrency - The target asset ticker.
    *
    * @returns A `Promise` resolving to:
    * - An array of intermediary hops as [oracle_id, ticker] pairs.
    */
    public async getSwapPath(fromCurrency: string, toCurrency: string): Promise<SwapPath[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getSwapPathMsg(fromCurrency, toCurrency));
    }

    /**
    * Retrieves the full swap tree starting from the base currency.
    *
    * This tree represents all known intermediary paths between supported assets.
    *
    * @returns A `Promise` resolving to:
    * - A recursive structure representing the swap tree by Oracle routes.
    */
    public async getSwapTree(): Promise<SwapTree> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getSwapTreeMsg());
    }

    /**
    * Checks whether a given address is authorized as a price feeder for the Oracle.
    *
    * @param address - The wallet address to verify.
    *
    * @returns A `Promise` resolving to:
    * - `true` if the address is a registered feeder, otherwise `false`.
    */
    public async isFeeder(address: string): Promise<boolean> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, isFeederMsg(address));
    }

    /**
    * Retrieves the list of all addresses currently authorized as price feeders.
    *
    * @returns A `Promise` resolving to:
    * - An array of bech32 wallet addresses.
    */
    public async getFeeders(): Promise<string[]> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getFeedersMsg());
    }

    /**
    * Retrieves the Oracle’s current configuration parameters.
    *
    * @returns A `Promise` resolving to an object containing:
    * - `min_feeders`: Minimum portion of feeder submissions required per price update (in permilles).
    * - `sample_period_secs`: Time interval between collected price samples (in seconds).
    * - `samples_number`: Number of samples used to compute the final price.
    * - `discount_factor`: Discount factor on old observations applied in the exponential moving average algorithm (in permilles).
    */
    public async getConfig(): Promise<OracleConfig> {
        return await this.cosmWasmClient.queryContractSmart(this._contractAddress, getConfigMsg());
    }

    /**
    * Executes a transaction to submit new price data to the Oracle.
    *
    * Only addresses registered as authorized feeders may submit price feeds.
    * The prices submitted are used to update the Oracle’s internal price records.
    *
    * @param nolusWallet - The wallet instance of the authorized feeder.
    * @param feedPrices - The price data to be submitted.
    * @param fee - The gas fee for the transaction.
    * @param fundCoin - Optional. Additional tokens to fund the transaction.
    *
    * @returns A `Promise` resolving to:
    * - The execution result, including transaction hash, gas usage and events.
    *
    * @throws If the wallet address is not whitelisted as a feeder, the contract will reject the execution.
    */
    public async feedPrices(nolusWallet: NolusWallet, feedPrices: FeedPrices, fee: StdFee | 'auto' | number, fundCoin?: Coin[]): Promise<ExecuteResult> {
        return nolusWallet.executeContract(this._contractAddress, feedPricesMsg(feedPrices), fee, undefined, fundCoin);
    }

    /**
    * Simulates the transaction for feeding prices to the Oracle, without broadcasting it.
    *
    * This is used to estimate gas or validate the structure of the feed before submission.
    *
    * @param nolusWallet - The wallet instance used for simulation.
    * @param feedPrices - The price data to simulate, same structure as `feedPrices`.
    * @param fundCoin - Optional. Simulated coins to cover fees.
    *
    * @returns A `Promise` resolving to:
    * - The simulated transaction result including gas and fee estimate.
    *
    * @throws If the address is not a whitelisted feeder, the simulation will fail.
    */
    public async simulateFeedPricesTx(nolusWallet: NolusWallet, feedPrices: FeedPrices, fundCoin?: Coin[]) {
        return nolusWallet.simulateExecuteContractTx(this._contractAddress, feedPricesMsg(feedPrices), fundCoin);
    }
}
