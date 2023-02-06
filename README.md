# Arcana Smart Contracts

[![codecov](https://codecov.io/gh/arcana-network/arcana-smart-contract/branch/dev/graph/badge.svg?token=4OCVSVNXIU)](https://codecov.io/gh/arcana-network/arcana-smart-contract)
[![Build Status](https://app.travis-ci.com/arcana-network/arcana-smart-contract.svg?token=2yjAythLGDwdY1XXtyDa&branch=dev)](https://app.travis-ci.com/arcana-network/arcana-smart-contract)

Arcana's [Auth SDK](https://github.com/arcana-network/auth) features are powered by Arcana Smart Contracts and [DKG Smart Contracts](https://github.com/arcana-network/dkg-smart-contract).

Arcana smart contracts are deployed and run on the Polygon Network. They manage the logic and state for implementing dApp configuration settings for Auth SDK usage and ensure data privacy and access control. To learn more about the different Arcana smart contracts, their role and interactions in the Arcana Network protocol, see [Arcana Smart Contract](https://docs.arcana.network/concepts/ansmartc/index.html) documentation.

## Developer Guide

 In this guide you will find instructions on how to modify or update these contracts, compile, lint, test, generate docs from smart contract source code comments, run code coverage, report gas and deploy the Arcana smart contracts.

### Pre Requisites

1. Copy .env.example to .env and set environment variables

```
$ cp .env.example .env
```

2. Install dependencies

```sh
$ npm i
```

### Compile

#### Hardhat

Use the following command to compile the smart contracts with Hardhat:

```sh
$ npm run compile
```

#### TypeChain

Use the following command to ompile the smart contracts and generate TypeChain artifacts:

```sh
$ npm run typechain
```

### Lint 

#### Solidity

Lint the Solidity code:

```sh
$ npm run lint:sol
```

#### TypeScript

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

### Syntax Highlighting

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
