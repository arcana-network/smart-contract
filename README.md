# Arcana Smart Contracts

[![codecov](https://codecov.io/gh/arcana-network/arcana-smart-contract/branch/dev/graph/badge.svg?token=4OCVSVNXIU)](https://codecov.io/gh/arcana-network/arcana-smart-contract)
[![Build Status](https://app.travis-ci.com/arcana-network/arcana-smart-contract.svg?token=2yjAythLGDwdY1XXtyDa&branch=dev)](https://app.travis-ci.com/arcana-network/arcana-smart-contract)

![image](https://user-images.githubusercontent.com/44583503/200472932-0e316f63-1076-4ba0-9799-98c406c6ee8f.png)

Arcana's [Storage SDK](https://github.com/arcana-network/storage) features are powered and maintained by Arcana Smart Contracts.

- Handle's main file operations like upload, share, revoke, changeFileOwner, delete etc..
- Storage SDK makes all its calls through meta-transactions which follow standard EIP Standards, EIP-2771 for making meta-transactions and Beacon proxy for making proxy calls.
- Handle's DIDs (Decentralized Identifiers) for files.
- Handle's private NFT data deployed on other chains.

## Contracts

### Logic Contract: Arcana.sol

This is the main logic contract that maintains logic for file operations and management, input data will be passed through this contract but data will not be stored on this contract.

### Factory: Factory.sol

This contract is used to create multiple beacon proxy contracts. Each app will have its own proxy contract but all of them will point to one logic contract. It also maintains gateway nodes and sets app-level storage and bandwidth limits.

### Beacon Proxy: ArcanaBeacon.sol

This contract is used to upgrade the logic contract code for the future versions.

### Forwarder: Forwarder.sol

This contract is used together with an ERC2771 compatible contract. Forwards proxy calls to logic contract.

### DID: DID.sol

This contract manages file details and checks file permissions for user access. Also takes care of linking and Downloading NFTs.

## Pre Requisites

Copy .env.example to .env and set environment variables

```
$ cp .env.example .env
```

Install dependencies

```sh
$ npm i
```

## Usage

### Compile

Compile the smart contracts with Hardhat:

```sh
$ npm run compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```sh
$ npm run typechain
```

### Lint Solidity

Lint the Solidity code:

```sh
$ npm run lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ npm run lint:ts
```

### Test

Run the Chai tests:

```sh
$ npm run test
```

### Coverage

Generate the code coverage report:

```sh
$ npm run coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true npm run test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ npm run clean
```

### Docs

Generate docs to smart contracts from the comments

```sh
$ npm run docs
```

## Deploy

Deploy the contracts to Hardhat Network:

```sh
$ npm run deploy
```

Deploy DKG contract

```sh
$ npm run deploy-dkg
```

Deploy the contracts to a specific network, such as the Ropsten testnet:

```sh
$ npm run deploy:network ropsten
```

## Syntax Highlighting

If you use VSCode, you can enjoy syntax highlighting for your Solidity code via the
[vscode-solidity](https://github.com/juanfranblanco/vscode-solidity) extension. The recommended approach to set the
compiler version is to add the following fields to your VSCode user settings:

```json
{
  "solidity.compileUsingRemoteVersion": "v0.8.3+commit.8d00100c",
  "solidity.defaultCompiler": "remote"
}
```

Where of course `v0.8.3+commit.8d00100c` can be replaced with any other version.
