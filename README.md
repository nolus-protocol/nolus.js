# Nolus.js

<br /><p align="center"><img alt="Nolus.js" src="nolusjs-logo.svg" width="100" margin-top="px"/></p><br />

JavaScript SDK for Nolus, written in TypeScript.

## Modules

* [client](src/client/) - Nolus Client service
* [wallet](src/wallet/) - Nolus Wallet service (Coin, Chain, Wallet, etc.)
* [contracts](src/contracts/) - Interact with the Nolus Protocol
* [utils](src/utils/) -  Utils (Currency, Keys, etc.)
* [constants](src/constants/) - Nolus network constants

## Get started

### Installation

```sh
yarn add @nolus/nolusjs
```

OR

```sh
npm install @nolus/nolusjs
```

### Usage

#### client

Set up Nolus client:

```js
NolusClient.setInstance(tendermintRpc);
```

#### wallet

Create and set up wallet:

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

Set up instance:

```js
NolusClient.setInstance(tendermintRpc);
const cosm = await NolusClient.getInstance().getCosmWasmClient();

    oracleInstance = new NolusContracts.Oracle(cosm, oracleContractAddress);
    leaserInstance = new NolusContracts.Leaser(cosm, leaserContractAddress);
    leaseInstance = new NolusContracts.Lease(cosm, leaseContractAddress);
    lppInstance = new NolusContracts.Lpp(cosm, lppContractAddress);
    treasuryInstance = new NolusContracts.Treasury(cosm, treasuryContractAddress);
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

Open Lease:

```js
// fee structure example

const fee =  {
    gas: '1000000',
    amount: [
      {
        amount: '50000',
        denom: ChainConstants.COIN_MINIMAL_DENOM;,
      },
    ],
  };

const downpaymentCurrencyToIbc = AssetUtils.makeIBCMinimalDenom('OSMO');

await leaserInstance.openLease(
        borrowerWallet,
        'OSMO' // wantedLeaseCurrency
        fee,
        [{ denom: downpaymentCurrencyToIbc, amount: '1000' }],
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

[The auto-generated API documentation](https://nolus-protocol.github.io/nolus.js/) - Requires basic TypeScript understanding.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md).

## Collaboration

Nolus.js uses [CosmJS](https://github.com/cosmos/cosmjs).