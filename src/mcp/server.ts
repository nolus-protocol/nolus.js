#!/usr/bin/env node
/**
 * Nolus MCP Server
 *
 * This MCP server exposes the @nolus/nolusjs library as tools that AI assistants
 * (like Claude in Cursor) can call to interact with the Nolus Protocol.
 *
 * Transaction tools return unsigned messages that users must sign manually
 * using nolusd CLI or a wallet like Keplr.
 *
 * Features:
 * - Query tools: Get lease status, oracle prices, pool balances, quotes, etc.
 * - Prepare tools: Generate unsigned transaction messages for manual signing
 *
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { Admin, Lease, Leaser, Lpp, Oracle, Treasury } from "../contracts/clients";
import { ChainConstants } from "../constants";
import {
    openLeaseMsg,
    repayLeaseMsg,
    closePositionLeaseMsg,
    changeClosePolicyMsg,
    depositMsg,
    burnMsg,
    claimRewardsMsg,
} from "../contracts/messages";

// ============================================================================
// Configuration / Multi-network support
// ============================================================================

type NetworkKey = "pirin" | "rila";

type NetworkConfig = {
    rpcUrl: string;
    adminAddress: string;
    chainId: string;
};

const NETWORK_CONFIGS: Record<NetworkKey, NetworkConfig> = {
    pirin: {
        // Mainnet (Pirin)
        rpcUrl: process.env.NOLUS_PIRIN_RPC_URL || "https://rpc.nolus.network/",
        adminAddress:
            process.env.NOLUS_PIRIN_ADMIN_ADDRESS ||
            "nolus1gurgpv8savnfw66lckwzn4zk7fp394lpe667dhu7aw48u40lj6jsqxf8nd",
        chainId: process.env.NOLUS_PIRIN_CHAIN_ID || "pirin-1",
    },
    rila: {
        // Testnet (Rila)
        rpcUrl: process.env.NOLUS_RILA_RPC_URL || "https://rila-rpc.nolus.network/",
        adminAddress: process.env.NOLUS_RILA_ADMIN_ADDRESS || "nolus17p9rzwnnfxcjp32un9ug7yhhzgtkhvl9jfksztgw5uh69wac2pgsmc5xhq",
        chainId: process.env.NOLUS_RILA_CHAIN_ID || "rila-3",
    },
};

type NetworkRuntime = {
    client: CosmWasmClient;
    config: NetworkConfig;
};

const networkRuntimes: Partial<Record<NetworkKey, NetworkRuntime>> = {};

const NetworkSchema = z
    .enum(["pirin", "rila"])
    .describe("Target Nolus network: 'pirin' (mainnet) or 'rila' (testnet). Defaults to 'pirin'.");

async function getNetworkRuntime(network?: NetworkKey): Promise<NetworkRuntime> {
    const selected: NetworkKey = network ?? "pirin";

    const existing = networkRuntimes[selected];
    if (existing) {
        return existing;
    }

    const baseConfig = NETWORK_CONFIGS[selected];

    if (!baseConfig.rpcUrl || !baseConfig.adminAddress || !baseConfig.chainId) {
        throw new Error(
            `[nolus-mcp] Missing configuration for network '${selected}'. ` +
                `Please update NETWORK_CONFIGS in src/mcp/server.ts.`
        );
    }

    console.error(
        `[nolus-mcp] Connecting to ${selected} network — RPC: ${baseConfig.rpcUrl}, chainId: ${baseConfig.chainId}`
    );

    const client = await CosmWasmClient.connect(baseConfig.rpcUrl);
    const runtime: NetworkRuntime = { client, config: baseConfig };
    networkRuntimes[selected] = runtime;
    return runtime;
}

// ============================================================================
// Server Setup
// ============================================================================

const server = new McpServer({
    name: "nolus-mcp",
    version: "1.0.0",
});

// ============================================================================
// Helper Functions
// ============================================================================

function formatResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}

/**
 * Generates a nolusd CLI command for executing a contract message
 */
function generateCliCommand(
    contractAddress: string,
    msg: Record<string, unknown>,
    funds: { amount: string; denom: string }[] | undefined,
    options: { keyName?: string; chainId: string }
): string {
    const msgJson = JSON.stringify(msg).replace(/"/g, '\\"');
    const keyName = options?.keyName || "<your-key-name>";
    const chainId = options.chainId;

    let cmd = `nolusd tx wasm execute ${contractAddress} "${msgJson}"`;

    if (funds && funds.length > 0) {
        const amountStr = funds.map(f => `${f.amount}${f.denom}`).join(",");
        cmd += ` --amount ${amountStr}`;
    }

    cmd += ` --from ${keyName}`;
    cmd += ` --chain-id ${chainId}`;
    cmd += ` --gas auto --gas-adjustment ${ChainConstants.GAS_MULTIPLIER}`;
    cmd += ` --gas-prices ${ChainConstants.GAS_PRICE}`;

    return cmd;
}

/**
 * Generates a nolusd CLI command for bank send
 */
function generateBankSendCommand(
    toAddress: string,
    amount: string,
    denom: string,
    options: { keyName?: string; chainId: string }
): string {
    const keyName = options?.keyName || "<your-key-name>";
    const chainId = options.chainId;

    return `nolusd tx bank send ${keyName} ${toAddress} ${amount}${denom} --chain-id ${chainId} --gas auto --gas-adjustment ${ChainConstants.GAS_MULTIPLIER} --gas-prices ${ChainConstants.GAS_PRICE}`;
}

/**
 * Generates a CosmJS/Keplr-compatible bank send message object
 */
function generateCosmJsBankSendMsg(
    toAddress: string,
    amount: string,
    denom: string
): object {
    return {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
            fromAddress: "<your-address>",
            toAddress,
            amount: [{ amount, denom }],
        },
    };
}

/**
 * Generates a CosmJS/Keplr-compatible execute contract message object
 */
function generateCosmJsExecuteMsg(
    contractAddress: string,
    msg: Record<string, unknown>,
    funds?: { amount: string; denom: string }[]
): object {
    return {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
            sender: "<your-address>",
            contract: contractAddress,
            msg,
            funds: funds || [],
        },
    };
}


// ============================================================================
// QUERY TOOLS (Read-Only)
// ============================================================================

// --- Admin Contract ---

server.registerTool(
    "get_protocols",
    {
        description:
            "Nolus blockchain: Retrieve all registered protocol identifiers from the Admin smart contract. Use this tool when the user asks which Nolus leveraged trading protocols or markets are available.",
        inputSchema: {
            network: NetworkSchema.optional(),
            adminAddress: z.string().optional().describe("Admin contract address (uses server default if not provided)"),
        },
    },
    async ({ network, adminAddress }) => {
        const { client, config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const admin = new Admin(client, adminAddress || config.adminAddress);
        const protocols = await admin.getProtocols();
        return formatResult({ protocols });
    }
);

server.registerTool(
    "get_protocol",
    {
        description:
            "Nolus blockchain: Retrieve full configuration and contract addresses for a specific protocol. Use this tool when the user mentions a protocol ID and needs its leaser, LPP, oracle or other contract addresses.",
        inputSchema: {
            protocol: z.string().describe("Protocol identifier e.g. 'OSMOSIS-OSMOSIS-USDC_AXELAR'"),
            network: NetworkSchema.optional(),
            adminAddress: z.string().optional().describe("Admin contract address"),
        },
    },
    async ({ protocol, network, adminAddress }) => {
        const { client, config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const admin = new Admin(client, adminAddress || config.adminAddress);
        const protocolInfo = await admin.getProtocol(protocol);
        return formatResult(protocolInfo);
    }
);

server.registerTool(
    "get_platform",
    {
        description:
            "Nolus blockchain: Retrieve global platform-level contract addresses such as treasury and timealarms. Use this tool when the user asks about core system contracts shared across all Nolus protocols.",
        inputSchema: {
            network: NetworkSchema.optional(),
            adminAddress: z.string().optional().describe("Admin contract address"),
        },
    },
    async ({ network, adminAddress }) => {
        const { client, config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const admin = new Admin(client, adminAddress || config.adminAddress);
        const platform = await admin.getPlatform();
        return formatResult(platform);
    }
);

// --- Leaser Contract ---

server.registerTool(
    "get_lease_quote",
    {
        description:
            "Nolus blockchain: Simulate opening a leveraged lease position and calculate a detailed quote. Use this tool when the user wants to preview leverage, borrow amounts or interest before opening a position.",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            downpaymentAmount: z.string().describe("Downpayment amount in micro-units e.g. '15000000' for 15 tokens"),
            downpaymentCurrency: z.string().describe("Downpayment currency ticker e.g. 'USDC_AXELAR'"),
            leaseAsset: z.string().describe("Asset to leverage e.g. 'OSMO', 'ATOM'"),
            maxLtd: z
                .number()
                .optional()
                .describe("Max loan-to-downpayment ratio in permilles (default 1500 = 2.5x leverage)"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaserAddress, downpaymentAmount, downpaymentCurrency, leaseAsset, maxLtd, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const leaser = new Leaser(client, leaserAddress);
        const quote = await leaser.leaseQuote(downpaymentAmount, downpaymentCurrency, leaseAsset, maxLtd);
        return formatResult(quote);
    }
);

server.registerTool(
    "get_open_leases",
    {
        description:
            "Nolus blockchain: List all currently active lease contracts (margin positions) for a wallet address. Use this tool when the user asks what open positions they currently have on Nolus.",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            ownerAddress: z.string().describe("Wallet address to query e.g. 'nolus1...'"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaserAddress, ownerAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const leaser = new Leaser(client, leaserAddress);
        const leases = await leaser.getCurrentOpenLeasesByOwner(ownerAddress);
        return formatResult({ ownerAddress, openLeases: leases, count: leases.length });
    }
);

server.registerTool(
    "get_leaser_config",
    {
        description:
            "Nolus blockchain: Retrieve the global configuration parameters of a Leaser smart contract. Use this tool when the user asks about lease system settings, risk thresholds or protocol parameters.",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaserAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const leaser = new Leaser(client, leaserAddress);
        const config = await leaser.getLeaserConfig();
        return formatResult(config);
    }
);

// --- Lease Contract ---

server.registerTool(
    "get_lease_status",
    {
        description:
            "Nolus blockchain: Retrieve the full status of a lease (margin position), including LTV, debt and close policy. Use this tool when the user asks for detailed health metrics of a specific position.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            dueProjectionSecs: z.number().optional().describe("Future projection time in seconds for interest calculation"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaseAddress, dueProjectionSecs, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lease = new Lease(client, leaseAddress);
        const status = await lease.getLeaseStatus(dueProjectionSecs);
        return formatResult(status);
    }
);

// --- LPP (Liquidity Provider Pool) Contract ---

server.registerTool(
    "get_lpp_balance",
    {
        description:
            "Nolus blockchain: Retrieve current liquidity, debt and pool statistics for a Liquidity Provider Pool (LPP). Use this tool when the user asks about pool utilization or lending capacity.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const balance = await lpp.getLppBalance();
        return formatResult(balance);
    }
);

server.registerTool(
    "get_lpp_config",
    {
        description:
            "Nolus blockchain: Retrieve configuration parameters of a Liquidity Provider Pool, including its interest rate model. Use this tool when the user asks how lender or protocol rates are determined.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const config = await lpp.getLppConfig();
        return formatResult(config);
    }
);

server.registerTool(
    "get_lpp_price",
    {
        description:
            "Nolus blockchain: Retrieve the current price of the nLPN receipt token relative to the pool's native asset. Use this tool when the user asks how much their nLPN shares are worth.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const price = await lpp.getPrice();
        return formatResult(price);
    }
);

server.registerTool(
    "get_lender_deposit",
    {
        description:
            "Nolus blockchain: Retrieve the current deposit balance for a lender in nLPN receipt tokens. Use this tool when the user asks how much they have lent into a specific Nolus pool.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            lenderAddress: z.string().describe("Lender wallet address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, lenderAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const deposit = await lpp.getLenderDeposit(lenderAddress);
        return formatResult({ lenderAddress, deposit });
    }
);

server.registerTool(
    "get_lender_rewards",
    {
        description:
            "Nolus blockchain: Retrieve accumulated NLS incentive rewards for a lender address. Use this tool when the user wants to know how many staking or incentive rewards they can claim from a pool.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            lenderAddress: z.string().describe("Lender wallet address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, lenderAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const rewards = await lpp.getLenderRewards(lenderAddress);
        return formatResult({ lenderAddress, rewards });
    }
);

server.registerTool(
    "get_deposit_capacity",
    {
        description:
            "Nolus blockchain: Retrieve the remaining deposit capacity of a Liquidity Provider Pool. Use this tool when the user asks whether more liquidity can be added to a given pool.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const capacity = await lpp.getDepositCapacity();
        return formatResult(capacity);
    }
);

server.registerTool(
    "get_lpn",
    {
        description:
            "Nolus blockchain: Retrieve the LPN (liquidity provider native) asset ticker used by a Liquidity Provider Pool. Use this tool when the user asks which base asset backs a specific LPP.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const lpp = new Lpp(client, lppAddress);
        const lpn = await lpp.getLPN();
        return formatResult({ lpn });
    }
);

// --- Oracle Contract ---

server.registerTool(
    "get_oracle_prices",
    {
        description:
            "Nolus blockchain: Retrieve all current asset prices from a Nolus oracle contract. Use this tool when the user asks for a broad view of on-chain prices for many assets at once.",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ oracleAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const oracle = new Oracle(client, oracleAddress);
        const prices = await oracle.getPrices();
        return formatResult(prices);
    }
);

server.registerTool(
    "get_asset_price",
    {
        description:
            "Nolus blockchain: Retrieve the current price of a specific asset relative to the oracle base currency. Use this tool when the user asks for the on-chain price of a single token like ATOM or NLS.",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
            currency: z.string().describe("Asset ticker e.g. 'OSMO', 'ATOM', 'NLS'"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ oracleAddress, currency, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const oracle = new Oracle(client, oracleAddress);
        const price = await oracle.getBasePrice(currency);
        return formatResult({ currency, price });
    }
);

server.registerTool(
    "get_currencies",
    {
        description:
            "Nolus blockchain: Retrieve all supported currencies and their metadata from the oracle. Use this tool when the user asks which assets are supported on Nolus or needs decimal and symbol information.",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ oracleAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const oracle = new Oracle(client, oracleAddress);
        const currencies = await oracle.getCurrencies();
        return formatResult(currencies);
    }
);

server.registerTool(
    "get_oracle_config",
    {
        description:
            "Nolus blockchain: Retrieve configuration parameters of the oracle contract. Use this tool when the user asks how price feeds are aggregated or how often prices are updated on-chain.",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ oracleAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const oracle = new Oracle(client, oracleAddress);
        const config = await oracle.getConfig();
        return formatResult(config);
    }
);

// --- Treasury Contract ---

server.registerTool(
    "calculate_rewards",
    {
        description:
            "Nolus blockchain: Calculate the total amount of NLS rewards to be distributed across all Liquidity Provider Pools. Use this tool when the user asks about global incentive emissions or reward schedules.",
        inputSchema: {
            treasuryAddress: z.string().describe("Treasury contract address"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ treasuryAddress, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const treasury = new Treasury(client, treasuryAddress);
        const rewards = await treasury.calculateRewards();
        return formatResult({ rewards });
    }
);

// --- Utility Tools ---

server.registerTool(
    "get_wallet_balance",
    {
        description:
            "Nolus blockchain: Retrieve the on-chain balance of a specific token for a wallet address. Use this tool when the user asks how many NLS or IBC tokens they currently hold.",
        inputSchema: {
            address: z.string().describe("Wallet address"),
            denom: z.string().describe("Token denomination (IBC denom or 'unls' for NLS)"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ address, denom, network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const balance = await client.getBalance(address, denom);
        return formatResult({ address, balance });
    }
);

server.registerTool(
    "get_block_height",
    {
        description:
            "Nolus blockchain: Retrieve the current block height of the Nolus chain. Use this tool when the user asks about network progress, recent blocks or wants to confirm chain liveness.",
        inputSchema: {
            network: NetworkSchema.optional(),
        },
    },
    async ({ network }) => {
        const { client } = await getNetworkRuntime(network as NetworkKey | undefined);
        const block = await client.getBlock();
        const height = block?.header?.height;
        return formatResult({ blockHeight: height });
    }
);

server.registerTool(
    "get_chain_id",
    {
        description:
            "Nolus blockchain: Retrieve the chain ID of the connected Nolus network (e.g. pirin-1 or rila-3). Use this tool when the user asks which Nolus network is being used for requests.",
        inputSchema: {
            network: NetworkSchema.optional(),
        },
    },
    async ({ network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        return formatResult({ chainId: config.chainId });
    }
);

// ============================================================================
// PREPARE TOOLS (Generate Unsigned Transactions)
// These tools return the transaction message and CLI command for manual signing
// ============================================================================

// --- Leaser Prepare ---

server.registerTool(
    "prepare_open_lease",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to open a leveraged lease position. Use this tool when the user wants to open a new position and needs a ready-to-sign Nolus CLI or CosmJS message.",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            leaseCurrency: z.string().describe("Asset to leverage e.g. 'OSMO', 'ATOM'"),
            downpaymentAmount: z.string().describe("Downpayment amount in micro-units"),
            downpaymentDenom: z.string().describe("IBC denom of downpayment token"),
            maxLtd: z.number().optional().describe("Max LTD in permilles (default 1500 = 2.5x leverage)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaserAddress, leaseCurrency, downpaymentAmount, downpaymentDenom, maxLtd, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const msg = openLeaseMsg(leaseCurrency, maxLtd);
        const funds = [{ amount: downpaymentAmount, denom: downpaymentDenom }];
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned transaction to open a leveraged position",
            contractAddress: leaserAddress,
            msg,
            funds,
            cli_command: generateCliCommand(leaserAddress, msg, funds, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(leaserAddress, msg, funds)],
            },
        });
    }
);

// --- Lease Prepare ---

server.registerTool(
    "prepare_repay_lease",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to repay debt on an existing lease. Use this tool when the user wants to reduce or fully repay the borrowed amount on a specific position.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            amount: z.string().describe("Repayment amount in micro-units"),
            denom: z.string().describe("IBC denom of repayment token"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaseAddress, amount, denom, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const msg = repayLeaseMsg();
        const funds = [{ amount, denom }];
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned transaction to repay lease debt",
            contractAddress: leaseAddress,
            msg,
            funds,
            cli_command: generateCliCommand(leaseAddress, msg, funds, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(leaseAddress, msg, funds)],
            },
        });
    }
);

server.registerTool(
    "prepare_close_lease",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to fully or partially close a lease position. Use this tool when the user wants to exit a position and needs a transaction skeleton.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            amount: z.string().optional().describe("Amount to close in micro-units (omit for full close)"),
            ticker: z.string().optional().describe("Asset ticker (required for partial close)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaseAddress, amount, ticker, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const closeAmount = amount && ticker ? { amount, ticker } : undefined;
        const msg = closePositionLeaseMsg(closeAmount);
        const chainId = config.chainId;

        return formatResult({
            description: closeAmount ? "Unsigned transaction to partially close lease" : "Unsigned transaction to fully close lease",
            contractAddress: leaseAddress,
            msg,
            funds: [],
            cli_command: generateCliCommand(leaseAddress, msg, undefined, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(leaseAddress, msg)],
            },
        });
    }
);

server.registerTool(
    "prepare_change_close_policy",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to update stop-loss and/or take-profit settings on a lease. Use this tool when the user wants to manage risk parameters on an existing position.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            stopLoss: z.number().nullable().optional().describe("Stop-loss LTV in permilles (null to remove)"),
            takeProfit: z.number().nullable().optional().describe("Take-profit LTV in permilles (null to remove)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ leaseAddress, stopLoss, takeProfit, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const msg = changeClosePolicyMsg(stopLoss, takeProfit);
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned transaction to change lease close policy (stop-loss/take-profit)",
            contractAddress: leaseAddress,
            msg,
            funds: [],
            cli_command: generateCliCommand(leaseAddress, msg, undefined, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(leaseAddress, msg)],
            },
        });
    }
);

// --- LPP Prepare ---

server.registerTool(
    "prepare_deposit_lpp",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to deposit liquidity into a Nolus Liquidity Provider Pool. Use this tool when the user wants to start or increase lending in a pool.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            amount: z.string().describe("Deposit amount in micro-units"),
            denom: z.string().describe("IBC denom of deposit token"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, amount, denom, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const msg = depositMsg();
        const funds = [{ amount, denom }];
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned transaction to deposit into LPP",
            contractAddress: lppAddress,
            msg,
            funds,
            cli_command: generateCliCommand(lppAddress, msg, funds, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(lppAddress, msg, funds)],
            },
        });
    }
);

server.registerTool(
    "prepare_withdraw_lpp",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to withdraw liquidity from a pool by burning nLPN. Use this tool when the user wants to redeem their pool shares back into the underlying asset.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            burnAmount: z.string().describe("Amount of nLPN to burn in micro-units"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, burnAmount, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const msg = burnMsg(burnAmount);
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned transaction to withdraw from LPP (burn nLPN)",
            contractAddress: lppAddress,
            msg,
            funds: [],
            cli_command: generateCliCommand(lppAddress, msg, undefined, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(lppAddress, msg)],
            },
        });
    }
);

server.registerTool(
    "prepare_claim_lpp_rewards",
    {
        description:
            "Nolus blockchain: Prepare an unsigned transaction to claim accumulated NLS rewards from a Liquidity Provider Pool. Use this tool when the user wants to collect incentive rewards without changing their deposit.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            recipientAddress: z.string().optional().describe("Recipient address (defaults to sender)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ lppAddress, recipientAddress, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const msg = claimRewardsMsg(recipientAddress);
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned transaction to claim NLS rewards from LPP",
            contractAddress: lppAddress,
            msg,
            funds: [],
            cli_command: generateCliCommand(lppAddress, msg, undefined, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsExecuteMsg(lppAddress, msg)],
            },
        });
    }
);

// --- Bank Transfer Prepare ---

server.registerTool(
    "prepare_transfer_tokens",
    {
        description:
            "Nolus blockchain: Prepare an unsigned bank send transaction for transferring tokens between addresses. Use this tool when the user wants to send NLS or other tokens on the Nolus chain and needs a CLI command.",
        inputSchema: {
            toAddress: z.string().describe("Recipient address"),
            amount: z.string().describe("Amount in micro-units"),
            denom: z.string().describe("Token denomination"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
            network: NetworkSchema.optional(),
        },
    },
    async ({ toAddress, amount, denom, keyName, network }) => {
        const { config } = await getNetworkRuntime(network as NetworkKey | undefined);
        const chainId = config.chainId;

        return formatResult({
            description: "Unsigned bank send transaction",
            toAddress,
            amount,
            denom,
            cli_command: generateBankSendCommand(toAddress, amount, denom, { keyName, chainId }),
            cosmjs_tx: {
                description: "CosmJS/Keplr message — replace <your-address> with the sender address",
                msgs: [generateCosmJsBankSendMsg(toAddress, amount, denom)],
            },
        });
    }
);

// ============================================================================
// Main
// ============================================================================

async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error("[nolus-mcp] Server started successfully");
    } catch (err) {
        console.error("[nolus-mcp] Failed to start server:", err);
        process.exit(1);
    }
}

main();
