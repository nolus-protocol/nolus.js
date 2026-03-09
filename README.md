# nolus.js

<br /><p align="center"><img alt="Nolus.js" src="nolusjs-logo.svg" width="100" margin-top="px"/></p><br />

## Overview

**nolus.js** is a TypeScript SDK for interacting with the Nolus Protocol - a novel DeFi primitive offering capital-efficient spot margin trading with fixed interest rates and a predictable leverage model. The SDK abstracts complex CosmWasm contract interactions and IBC logic, enabling developers to quote, open, monitor, and repay leveraged positions across supported Cosmos chains.

## Modules

* [client](src/client/) - Connects to the blockchain via Tendermint RPC
* [wallet](src/wallet/) - Wallet abstraction using CosmJS OfflineSigner (e.g., used as a parameter for contract interactions)
* [contracts](src/contracts/) - Interacts with smart contracts (opening margin/lease positions, reading Oracle prices, etc.)
* [utils](src/utils/) -  Asset parsing, denom formatting, key generation
* [constants](src/constants/) - Chain defaults (e.g., bech32 prefixes, gas configurations)

## Get started

### 1. Installation

```sh
yarn add @nolus/nolusjs
```

OR

```sh
npm install @nolus/nolusjs
```

### 2. Prerequisites

* Node.js >= 16
* Access to a Nolus RPC node
* Contract addresses for Leaser, Lease, Oracle, LPP, and Treasury
* Basic familiarity with [CosmJS](https://github.com/cosmos/cosmjs) and the [Cosmos SDK](https://github.com/cosmos/cosmos-sdk)

### 3. Usage

💡 Note: For direct usage of the SDK and examples below, ensure your environment supports ES Modules and TypeScript via tools like tsx, Vite, or Babel.

#### client

Initialize the Nolus client with a Tendermint RPC endpoint to enable communication with the blockchain:

```js
NolusClient.setInstance(tendermintRpc);
```

#### wallet

Create and set up a wallet by generating a mnemonic, deriving the private key, and mapping it to a public key, followed by the final wallet address using the nolus bech32 prefix:

```js
const mnemonic = KeyUtils.generateMnemonic();
  const accountNumbers = [0];
  const path = accountNumbers.map(makeCosmoshubPath)[0];
  const privateKey = await KeyUtils.getPrivateKeyFromMnemonic(mnemonic, path);

 // Set up wallet
  const offlineSigner = await DirectSecp256k1Wallet.fromKey(
    privateKey,
    ChainConstants.BECH32_PREFIX_ACC_ADDR,
  );

const nolusWallet = await nolusOfflineSigner(offlineSigner);
nolusWallet.useAccount();
```

#### contracts

Each contract class wraps read and write access to a CosmWasm smart contract. These are initialized with a CosmWasm client and a contract address:

```js
NolusClient.setInstance(tendermintRpc);
const cosm = await NolusClient.getInstance().getCosmWasmClient();

    oracleInstance = new NolusContracts.Oracle(cosm, oracleContractAddress); // Provides EMA (Exponential Moving Average) prices to the system
    leaserInstance = new NolusContracts.Leaser(cosm, leaserContractAddress);  // Factory contract responsible for instantiating leverage positions
    leaseInstance = new NolusContracts.Lease(cosm, leaseContractAddress); // Isolated contract instance representing an individual margin position
    lppInstance = new NolusContracts.Lpp(cosm, lppContractAddress); // Single-sided lending pool contract
    treasuryInstance = new NolusContracts.Treasury(cosm, treasuryContractAddress); // Manages protocol revenue in the form of NLS tokens
```

Nolus Protocol interacting:

Lease Quote:

```js
await leaserInstance.leaseQuote(
        '1000', // downpaymentAmount
        'unls' // downpaymentCurrencyTicker
        'OSMO' // wantedLeaseCurrency
      );
```

Open a new lease (margin) position:

```js
// fee structure example

const fee =  {
    gas: '1000000',
    amount: [
      {
        amount: '50000',
        denom: ChainConstants.COIN_MINIMAL_DENOM
      },
    ],
  };

const currencies = await oracleInstance.getCurrencies();
const bankSymbol = AssetUtils.findBankSymbolByTicker(currencies, downpaymentCurrencyTicker); // ibc/abcd1234....

await leaserInstance.openLease(
        borrowerWallet,
        'OSMO', // wantedLeaseCurrency
        fee,
        [{ denom: bankSymbol, amount: '1000' }] // downpayment
      );
```

Get Leaser contract config:

```js
await leaserInstance.getConfig();
```

#### utils and constants

Import and use directly:

```js
ChainConstants.COIN_TYPE;
```

```js
const privateKey = await KeyUtils.getPrivateKeyFromMnemonic(mnemonic, path);
```

## MCP Server

The Nolus MCP server exposes the `@nolus/nolusjs` library as tools that AI assistants can use to interact with the Nolus Protocol.

### Features

#### Query tools (read-only)

- **`get_protocols`**: List all registered protocols.
- **`get_protocol`**: Get protocol details and contract addresses.
- **`get_platform`**: Get platform-level contracts (treasury, timealarms).
- **`get_lease_quote`**: Calculate a quote for opening a leveraged position.
- **`get_open_leases`**: Get all active leases for a wallet.
- **`get_leaser_config`**: Get leaser configuration.
- **`get_lease_status`**: Get status of a specific lease.
- **`get_lpp_balance`**: Get liquidity pool balance.
- **`get_lpp_config`**: Get pool configuration.
- **`get_lpp_price`**: Get nLPN receipt token price.
- **`get_lender_deposit`**: Get lender's deposit balance.
- **`get_lender_rewards`**: Get lender's pending rewards.
- **`get_deposit_capacity`**: Get remaining deposit capacity.
- **`get_lpn`**: Get pool's native asset ticker.
- **`get_oracle_prices`**: Get all asset prices.
- **`get_asset_price`**: Get price of a specific asset.
- **`get_currencies`**: Get all supported currencies.
- **`get_oracle_config`**: Get oracle configuration.
- **`calculate_rewards`**: Calculate NLS rewards distribution.
- **`get_wallet_balance`**: Get token balance for an address.
- **`get_block_height`**: Get current block height.
- **`get_chain_id`**: Get chain ID.

#### Prepare tools (generate unsigned transactions)

These tools return the transaction message and a ready-to-use CLI command:

- **`prepare_open_lease`**: Prepare a lease opening transaction.
- **`prepare_repay_lease`**: Prepare a lease repayment transaction.
- **`prepare_close_lease`**: Prepare a lease close transaction (full or partial).
- **`prepare_change_close_policy`**: Prepare stop-loss/take-profit update.
- **`prepare_deposit_lpp`**: Prepare a deposit into liquidity pool.
- **`prepare_withdraw_lpp`**: Prepare a withdrawal from liquidity pool.
- **`prepare_claim_lpp_rewards`**: Prepare NLS rewards claim.
- **`prepare_transfer_tokens`**: Prepare a bank send transaction.

### Running the MCP server

#### Network configuration

By default, the MCP server has **built‑in configs** for:

- **Mainnet (Pirin)** – `network: "pirin"` (default)
- **Testnet (Rila)** – `network: "rila"`

You can optionally override the defaults with environment variables:

| Variable | Description | Applies to |
| --- | --- | --- |
| `NOLUS_PIRIN_RPC_URL` | Pirin RPC endpoint | mainnet |
| `NOLUS_PIRIN_ADMIN_ADDRESS` | Pirin Admin contract address | mainnet |
| `NOLUS_PIRIN_CHAIN_ID` | Pirin chain ID used in generated CLI commands | mainnet |
| `NOLUS_RILA_RPC_URL` | Rila RPC endpoint | testnet |
| `NOLUS_RILA_ADMIN_ADDRESS` | Rila Admin contract address | testnet |
| `NOLUS_RILA_CHAIN_ID` | Rila chain ID used in generated CLI commands | testnet |

Most tools accept an optional `network` parameter so you can query **per request**:

- Omit `network` → uses **Pirin** by default.
- Set `network: "rila"` → query against **Rila**.

#### Connecting from Cursor / Claude Desktop

Configure MCP as follows (adjust the absolute path to this repo):

```json
{
  "mcpServers": {
    "nolus": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/nolus.js/src/mcp/server.ts"],
      "env": {} // Optionally, override the default settings with environment variables
    }
  }
}
```

After saving, restart your editor/Claude Desktop; the server will appear under MCP settings.

#### Run manually

```sh
npm run mcp
```

To override the built‑in network settings, export the corresponding env vars before running, for example:

```sh
export NOLUS_PIRIN_RPC_URL=
export NOLUS_PIRIN_ADMIN_ADDRESS=
export NOLUS_PIRIN_CHAIN_ID=
export NOLUS_RILA_RPC_URL=
...
npm run mcp
```

### Reference prompt for AI agents

You can use the following prompt as a reference for correctly interacting with `@nolus/nolusjs` and the Nolus MCP server:

```text
You are a Nolus Protocol agent. Before doing anything else, ensure the environment is ready:

## Step 1: Set up the Nolus MCP server
- Clone the nolusjs library: `git clone https://github.com/nolus-protocol/nolus.js`
- Install dependencies: `cd nolus.js && npm install`
- Register the following MCP server in your client's configuration:
  - Command: `npx tsx <absolute-path-to-nolus.js>/src/mcp/server.ts`
  - Environment variables:
    - NOLUS_PIRIN_RPC_URL=https://rpc.nolus.network
    - NOLUS_PIRIN_ADMIN_ADDRESS= nolus1gurgpv8savnfw66lckwzn4zk7fp394lpe667dhu7aw48u40lj6jsqxf8nd
    - NOLUS_PIRIN_CHAIN_ID=pirin-1
- Reload your MCP tools so the server is available

## Step 2: Install nolusd if not already available
- Detect OS and architecture
- Download the appropriate binary from the latest release at
  https://github.com/nolus-protocol/nolus-core/releases/latest
- Install it to a directory on your PATH and make it executable
- Verify with `nolusd version`

## Step 3: Configure nolusd
- `nolusd config set client chain-id pirin-1`
- `nolusd config set client node https://rpc.nolus.network:443`

Confirm setup is complete and list any existing keys with `nolusd keys list`.
You are now ready to interact with Nolus Protocol.
```

## API Documentation

For detailed, developer-oriented information on all core business functions, including:

Complete parameter descriptions

Expected response structures

Usage notes for each contract method

➡️ [View the auto-generated API documentation](https://nolus-protocol.github.io/nolus.js/)

These docs are generated directly from the TypeScript source and are the most up-to-date reference for working with the SDK.

## Collaboration

Nolus.js uses [CosmJS](https://github.com/cosmos/cosmjs).
