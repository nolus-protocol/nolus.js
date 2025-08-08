# Nolus.js

<br /><p align="center"><img alt="Nolus.js" src="nolusjs-logo.svg" width="100" margin-top="px"/></p><br />

## Overview

nolus.js is a TypeScript SDK for interacting with the Nolus Protocol - a novel DeFi primitive offering capital-efficient spot margin trading with fixed interest rates and a predictable leverage model. The SDK abstracts complex CosmWasm contract interactions and IBC logic, enabling developers to quote, open, monitor, and repay leveraged positions across supported Cosmos chains.

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

### Usage

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
        [{ denom: bankSymbol, amount: '1000' }]
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

## API Documentation

For detailed, developer-oriented information on all core business functions, including:

Complete parameter descriptions

Expected response structures

Usage notes for each contract method

➡️ [View the auto-generated API documentation](https://nolus-protocol.github.io/nolus.js/)

These docs are generated directly from the TypeScript source and are the most up-to-date reference for working with the SDK.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md).

## Collaboration

Nolus.js uses [CosmJS](https://github.com/cosmos/cosmjs).
