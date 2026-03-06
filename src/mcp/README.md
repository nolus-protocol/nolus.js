# Nolus MCP Server

This MCP (Model Context Protocol) server exposes the `@nolus/nolusjs` library as tools that AI assistants can use to interact with the Nolus Protocol.

## Features

### Query Tools (Read-Only)

- `get_protocols` - List all registered protocols
- `get_protocol` - Get protocol details and contract addresses
- `get_platform` - Get platform-level contracts (treasury, timealarms)
- `get_lease_quote` - Calculate a quote for opening a leveraged position
- `get_open_leases` - Get all active leases for a wallet
- `get_leaser_config` - Get leaser configuration
- `get_lease_status` - Get status of a specific lease
- `get_lpp_balance` - Get liquidity pool balance
- `get_lpp_config` - Get pool configuration
- `get_lpp_price` - Get nLPN receipt token price
- `get_lender_deposit` - Get lender's deposit balance
- `get_lender_rewards` - Get lender's pending rewards
- `get_deposit_capacity` - Get remaining deposit capacity
- `get_lpn` - Get pool's native asset ticker
- `get_oracle_prices` - Get all asset prices
- `get_asset_price` - Get price of a specific asset
- `get_currencies` - Get all supported currencies
- `get_oracle_config` - Get oracle configuration
- `calculate_rewards` - Calculate NLS rewards distribution
- `get_wallet_balance` - Get token balance for an address
- `get_block_height` - Get current block height
- `get_chain_id` - Get chain ID

### Prepare Tools (Generate Unsigned Transactions)

These tools return the transaction message and a ready-to-use CLI command:

- `prepare_open_lease` - Prepare a lease opening transaction
- `prepare_repay_lease` - Prepare a lease repayment transaction
- `prepare_close_lease` - Prepare a lease close transaction (full or partial)
- `prepare_change_close_policy` - Prepare stop-loss/take-profit update
- `prepare_deposit_lpp` - Prepare a deposit into liquidity pool
- `prepare_withdraw_lpp` - Prepare a withdrawal from liquidity pool
- `prepare_claim_lpp_rewards` - Prepare NLS rewards claim
- `prepare_transfer_tokens` - Prepare a bank send transaction

## Running the Server

### Network configuration

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

### Connecting

Create or edit `~/.cursor/mcp.json`;

Create or edit the Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
    "mcpServers": {
        "nolus": {
            "command": "npx",
            "args": ["tsx", "/absolute/path/to/nolus.js/src/mcp/server.ts"],
            "env": {}
        }
    }
}
```

Restart after saving the file. The MCP server will appear under **Settings → MCP**.

### Run Manually

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
