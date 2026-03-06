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
 * Usage:
 *   NOLUS_RPC_URL="https://..." NOLUS_CHAIN_ID="..." NOLUS_ADMIN_ADDRESS="..." npx tsx src/mcp/server.ts
 *
 * Environment variables:
 *   NOLUS_RPC_URL        RPC endpoint (required)
 *   NOLUS_ADMIN_ADDRESS  Admin contract address (required)
 *   NOLUS_CHAIN_ID       Chain ID used in CLI commands (required)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

import { NolusClient } from "../client";
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
// Configuration
// ============================================================================

type RuntimeConfig = {
    rpcUrl: string;
    adminAddress: string;
    chainId: string;
};

let config: RuntimeConfig | undefined;

function getConfig(): RuntimeConfig {
    if (config) return config;

    const rpcUrl = process.env.NOLUS_RPC_URL;
    const adminAddress = process.env.NOLUS_ADMIN_ADDRESS;
    const chainId = process.env.NOLUS_CHAIN_ID;

    const missing: string[] = [];
    if (!rpcUrl) missing.push("NOLUS_RPC_URL");
    if (!adminAddress) missing.push("NOLUS_ADMIN_ADDRESS");
    if (!chainId) missing.push("NOLUS_CHAIN_ID");

    if (missing.length > 0) {
        throw new Error(
            `[nolus-mcp] Missing required env vars: ${missing.join(", ")}. ` +
                `Example: NOLUS_RPC_URL="https://..." NOLUS_CHAIN_ID="..." ` +
                `NOLUS_ADMIN_ADDRESS="nolus..." npx tsx src/mcp/server.ts`
        );
    }

    // At this point the values are guaranteed to be defined (see missing[] check above).
    const resolved: RuntimeConfig = {
        rpcUrl: rpcUrl!,
        adminAddress: adminAddress!,
        chainId: chainId!,
    };

    config = resolved;
    return resolved;
}

// Keep for backward compatibility (tools that fall back to this)
const CONTRACTS = {
    get admin() {
        return getConfig().adminAddress;
    },
};

// ============================================================================
// Server Setup
// ============================================================================

const server = new McpServer({
    name: "nolus-mcp",
    version: "1.0.0",
});

let cosmWasmClient: CosmWasmClient;

async function initializeClients() {
    const cfg = getConfig();

    console.error(`[nolus-mcp] RPC URL      : ${cfg.rpcUrl}`);
    console.error(`[nolus-mcp] Admin address: ${cfg.adminAddress}`);
    console.error(`[nolus-mcp] Chain ID     : ${cfg.chainId}`);

    NolusClient.setInstance(cfg.rpcUrl);
    cosmWasmClient = await NolusClient.getInstance().getCosmWasmClient();
}

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
    funds?: { amount: string; denom: string }[],
    options?: { keyName?: string; chainId?: string }
): string {
    const msgJson = JSON.stringify(msg).replace(/"/g, '\\"');
    const keyName = options?.keyName || "<your-key-name>";
    const chainId = options?.chainId || getConfig().chainId;

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
    options?: { keyName?: string; chainId?: string }
): string {
    const keyName = options?.keyName || "<your-key-name>";
    const chainId = options?.chainId || getConfig().chainId;

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
        description: "Get all registered protocol identifiers from the Nolus Admin contract",
        inputSchema: {
            adminAddress: z.string().optional().describe("Admin contract address (uses server default if not provided)"),
        },
    },
    async ({ adminAddress }) => {
        const admin = new Admin(cosmWasmClient, adminAddress || CONTRACTS.admin);
        const protocols = await admin.getProtocols();
        return formatResult({ protocols });
    }
);

server.registerTool(
    "get_protocol",
    {
        description: "Get detailed configuration for a specific Nolus protocol including contract addresses",
        inputSchema: {
            protocol: z.string().describe("Protocol identifier e.g. 'OSMOSIS-OSMOSIS-USDC_AXELAR'"),
            adminAddress: z.string().optional().describe("Admin contract address"),
        },
    },
    async ({ protocol, adminAddress }) => {
        const admin = new Admin(cosmWasmClient, adminAddress || CONTRACTS.admin);
        const protocolInfo = await admin.getProtocol(protocol);
        return formatResult(protocolInfo);
    }
);

server.registerTool(
    "get_platform",
    {
        description: "Get platform-level contract addresses (treasury, timealarms)",
        inputSchema: {
            adminAddress: z.string().optional().describe("Admin contract address"),
        },
    },
    async ({ adminAddress }) => {
        const admin = new Admin(cosmWasmClient, adminAddress || CONTRACTS.admin);
        const platform = await admin.getPlatform();
        return formatResult(platform);
    }
);

// --- Leaser Contract ---

server.registerTool(
    "get_lease_quote",
    {
        description: "Calculate a quote for opening a leveraged position on Nolus",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            downpaymentAmount: z.string().describe("Downpayment amount in micro-units e.g. '15000000' for 15 tokens"),
            downpaymentCurrency: z.string().describe("Downpayment currency ticker e.g. 'USDC_AXELAR'"),
            leaseAsset: z.string().describe("Asset to leverage e.g. 'OSMO', 'ATOM'"),
            maxLtd: z.number().optional().describe("Max loan-to-downpayment ratio in permilles (default 1500 = 2.5x leverage)"),
        },
    },
    async ({ leaserAddress, downpaymentAmount, downpaymentCurrency, leaseAsset, maxLtd }) => {
        const leaser = new Leaser(cosmWasmClient, leaserAddress);
        const quote = await leaser.leaseQuote(downpaymentAmount, downpaymentCurrency, leaseAsset, maxLtd);
        return formatResult(quote);
    }
);

server.registerTool(
    "get_open_leases",
    {
        description: "Get all currently active margin positions (leases) for a wallet address",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            ownerAddress: z.string().describe("Wallet address to query e.g. 'nolus1...'"),
        },
    },
    async ({ leaserAddress, ownerAddress }) => {
        const leaser = new Leaser(cosmWasmClient, leaserAddress);
        const leases = await leaser.getCurrentOpenLeasesByOwner(ownerAddress);
        return formatResult({ ownerAddress, openLeases: leases, count: leases.length });
    }
);

server.registerTool(
    "get_leaser_config",
    {
        description: "Get the global configuration parameters from the leaser contract",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
        },
    },
    async ({ leaserAddress }) => {
        const leaser = new Leaser(cosmWasmClient, leaserAddress);
        const config = await leaser.getLeaserConfig();
        return formatResult(config);
    }
);

// --- Lease Contract ---

server.registerTool(
    "get_lease_status",
    {
        description: "Get the current status of a margin position (lease) including LTV, debt, and close policy",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            dueProjectionSecs: z.number().optional().describe("Future projection time in seconds for interest calculation"),
        },
    },
    async ({ leaseAddress, dueProjectionSecs }) => {
        const lease = new Lease(cosmWasmClient, leaseAddress);
        const status = await lease.getLeaseStatus(dueProjectionSecs);
        return formatResult(status);
    }
);

// --- LPP (Liquidity Provider Pool) Contract ---

server.registerTool(
    "get_lpp_balance",
    {
        description: "Get the current liquidity and debt statistics of a Liquidity Provider Pool",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
        },
    },
    async ({ lppAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const balance = await lpp.getLppBalance();
        return formatResult(balance);
    }
);

server.registerTool(
    "get_lpp_config",
    {
        description: "Get the configuration parameters of a Liquidity Provider Pool including interest rate model",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
        },
    },
    async ({ lppAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const config = await lpp.getLppConfig();
        return formatResult(config);
    }
);

server.registerTool(
    "get_lpp_price",
    {
        description: "Get the current price of the receipt token (nLPN) relative to the pool's native asset",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
        },
    },
    async ({ lppAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const price = await lpp.getPrice();
        return formatResult(price);
    }
);

server.registerTool(
    "get_lender_deposit",
    {
        description: "Get the current deposit balance for a lender in receipt tokens (nLPN)",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            lenderAddress: z.string().describe("Lender wallet address"),
        },
    },
    async ({ lppAddress, lenderAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const deposit = await lpp.getLenderDeposit(lenderAddress);
        return formatResult({ lenderAddress, deposit });
    }
);

server.registerTool(
    "get_lender_rewards",
    {
        description: "Get the accumulated NLS incentive rewards for a lender",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            lenderAddress: z.string().describe("Lender wallet address"),
        },
    },
    async ({ lppAddress, lenderAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const rewards = await lpp.getLenderRewards(lenderAddress);
        return formatResult({ lenderAddress, rewards });
    }
);

server.registerTool(
    "get_deposit_capacity",
    {
        description: "Get the remaining deposit capacity for a Liquidity Provider Pool",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
        },
    },
    async ({ lppAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const capacity = await lpp.getDepositCapacity();
        return formatResult(capacity);
    }
);

server.registerTool(
    "get_lpn",
    {
        description: "Get the native asset ticker used by a Liquidity Provider Pool",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
        },
    },
    async ({ lppAddress }) => {
        const lpp = new Lpp(cosmWasmClient, lppAddress);
        const lpn = await lpp.getLPN();
        return formatResult({ lpn });
    }
);

// --- Oracle Contract ---

server.registerTool(
    "get_oracle_prices",
    {
        description: "Get all current asset prices from a Nolus oracle contract",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
        },
    },
    async ({ oracleAddress }) => {
        const oracle = new Oracle(cosmWasmClient, oracleAddress);
        const prices = await oracle.getPrices();
        return formatResult(prices);
    }
);

server.registerTool(
    "get_asset_price",
    {
        description: "Get the current price of a specific asset relative to the base currency",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
            currency: z.string().describe("Asset ticker e.g. 'OSMO', 'ATOM', 'NLS'"),
        },
    },
    async ({ oracleAddress, currency }) => {
        const oracle = new Oracle(cosmWasmClient, oracleAddress);
        const price = await oracle.getBasePrice(currency);
        return formatResult({ currency, price });
    }
);

server.registerTool(
    "get_currencies",
    {
        description: "Get all supported currencies and their metadata from the oracle",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
        },
    },
    async ({ oracleAddress }) => {
        const oracle = new Oracle(cosmWasmClient, oracleAddress);
        const currencies = await oracle.getCurrencies();
        return formatResult(currencies);
    }
);

server.registerTool(
    "get_oracle_config",
    {
        description: "Get the oracle configuration parameters",
        inputSchema: {
            oracleAddress: z.string().describe("Oracle contract address"),
        },
    },
    async ({ oracleAddress }) => {
        const oracle = new Oracle(cosmWasmClient, oracleAddress);
        const config = await oracle.getConfig();
        return formatResult(config);
    }
);

// --- Treasury Contract ---

server.registerTool(
    "calculate_rewards",
    {
        description: "Calculate the amount of NLS rewards to be distributed across all LPPs",
        inputSchema: {
            treasuryAddress: z.string().describe("Treasury contract address"),
        },
    },
    async ({ treasuryAddress }) => {
        const treasury = new Treasury(cosmWasmClient, treasuryAddress);
        const rewards = await treasury.calculateRewards();
        return formatResult({ rewards });
    }
);

// --- Utility Tools ---

server.registerTool(
    "get_wallet_balance",
    {
        description: "Get the balance of a specific token for a wallet address",
        inputSchema: {
            address: z.string().describe("Wallet address"),
            denom: z.string().describe("Token denomination (IBC denom or 'unls' for NLS)"),
        },
    },
    async ({ address, denom }) => {
        const balance = await NolusClient.getInstance().getBalance(address, denom);
        return formatResult({ address, balance });
    }
);

server.registerTool(
    "get_block_height",
    {
        description: "Get the current block height of the Nolus chain",
    },
    async () => {
        const height = await NolusClient.getInstance().getBlockHeight();
        return formatResult({ blockHeight: height });
    }
);

server.registerTool(
    "get_chain_id",
    {
        description: "Get the chain ID of the connected Nolus network",
    },
    async () => {
        const chainId = await NolusClient.getInstance().getChainId();
        return formatResult({ chainId });
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
        description: "Prepare an unsigned transaction to open a leveraged position. Returns the message and CLI command for manual signing.",
        inputSchema: {
            leaserAddress: z.string().describe("Leaser contract address"),
            leaseCurrency: z.string().describe("Asset to leverage e.g. 'OSMO', 'ATOM'"),
            downpaymentAmount: z.string().describe("Downpayment amount in micro-units"),
            downpaymentDenom: z.string().describe("IBC denom of downpayment token"),
            maxLtd: z.number().optional().describe("Max LTD in permilles (default 1500 = 2.5x leverage)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ leaserAddress, leaseCurrency, downpaymentAmount, downpaymentDenom, maxLtd, keyName }) => {
        const msg = openLeaseMsg(leaseCurrency, maxLtd);
        const funds = [{ amount: downpaymentAmount, denom: downpaymentDenom }];
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned transaction to repay a lease. Returns the message and CLI command for manual signing.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            amount: z.string().describe("Repayment amount in micro-units"),
            denom: z.string().describe("IBC denom of repayment token"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ leaseAddress, amount, denom, keyName }) => {
        const msg = repayLeaseMsg();
        const funds = [{ amount, denom }];
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned transaction to close a lease (full or partial). Returns the message and CLI command for manual signing.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            amount: z.string().optional().describe("Amount to close in micro-units (omit for full close)"),
            ticker: z.string().optional().describe("Asset ticker (required for partial close)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ leaseAddress, amount, ticker, keyName }) => {
        const closeAmount = amount && ticker ? { amount, ticker } : undefined;
        const msg = closePositionLeaseMsg(closeAmount);
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned transaction to set stop-loss and/or take-profit on a lease. Returns the message and CLI command for manual signing.",
        inputSchema: {
            leaseAddress: z.string().describe("Lease contract address"),
            stopLoss: z.number().nullable().optional().describe("Stop-loss LTV in permilles (null to remove)"),
            takeProfit: z.number().nullable().optional().describe("Take-profit LTV in permilles (null to remove)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ leaseAddress, stopLoss, takeProfit, keyName }) => {
        const msg = changeClosePolicyMsg(stopLoss, takeProfit);
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned transaction to deposit into a Liquidity Provider Pool. Returns the message and CLI command for manual signing.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            amount: z.string().describe("Deposit amount in micro-units"),
            denom: z.string().describe("IBC denom of deposit token"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ lppAddress, amount, denom, keyName }) => {
        const msg = depositMsg();
        const funds = [{ amount, denom }];
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned transaction to withdraw from a Liquidity Provider Pool by burning nLPN. Returns the message and CLI command for manual signing.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            burnAmount: z.string().describe("Amount of nLPN to burn in micro-units"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ lppAddress, burnAmount, keyName }) => {
        const msg = burnMsg(burnAmount);
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned transaction to claim NLS rewards from a Liquidity Provider Pool. Returns the message and CLI command for manual signing.",
        inputSchema: {
            lppAddress: z.string().describe("LPP contract address"),
            recipientAddress: z.string().optional().describe("Recipient address (defaults to sender)"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ lppAddress, recipientAddress, keyName }) => {
        const msg = claimRewardsMsg(recipientAddress);
        const chainId = await NolusClient.getInstance().getChainId();

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
        description: "Prepare an unsigned bank send transaction. Returns the CLI command for manual signing.",
        inputSchema: {
            toAddress: z.string().describe("Recipient address"),
            amount: z.string().describe("Amount in micro-units"),
            denom: z.string().describe("Token denomination"),
            keyName: z.string().optional().describe("Your nolusd key name for the CLI command"),
        },
    },
    async ({ toAddress, amount, denom, keyName }) => {
        const chainId = await NolusClient.getInstance().getChainId();

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
        await initializeClients();

        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error("[nolus-mcp] Server started successfully");
    } catch (err) {
        console.error("[nolus-mcp] Failed to start server:", err);
        process.exit(1);
    }
}

main();
