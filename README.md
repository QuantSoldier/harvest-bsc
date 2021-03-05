# Harvest Finance - Binance Smart Chain

The people are hungry and only solution for Chad the Farmer was to increase his output. Chad put down his old pastries, Ganache and Truffle, and picked up his Hardhat. For Chad knew, it was time to build. Cross-chain Yield Farming was Chad's newest innovation in giving bread to the people.

## Installation

1. Install dependencies with Yarn

```
yarn install
```

2. Compile contracts & build artifacts with Hardhat

```
yarn compile
```

3. Run tests with Waffle

```
yarn test
```

## Usage

- Deploy the contracts

```
npx hardhat --network testnet deploy

yarn testnet:deploy
yarn mainnet:deploy
```

- Run a script

```
npx hardhat --network testnet run scripts/my_script.ts

yarn testnet:run scripts/my_script.ts
yarn mainnet:run scripts/my_script.ts
```

- Verifying a contract (https://docs.binance.org/smart-chain/developer/deploy/hardhat-verify.html)

```
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1" "Constructor argument 2"

yarn testnet:verify 0x314D178737D8F63a53f362a2145BBC2272537A02 "0xff3b7e5Ff30fCd84CC2351f56F3e20397e54E52D" "0x935f7Bc1ba9015cEbaE8d98D4B5F8Dae30a2E84d"
yarn mainnet:verify 0xbF39886B4F91F5170934191b0d96Dd277147FBB2
```

## References

- Hardhat: https://hardhat.org/getting-started/
- Hardhat Deploy: https://hardhat.org/plugins/hardhat-deploy.html
- BSC Hardhat Setup: https://docs.binance.org/smart-chain/developer/deploy/hardhat.html
- BSC Metamask Setup: https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain
- BSC Bridge: https://www.binance.org/en/bridge
- BSC-ETH Swap Contracts: https://github.com/binance-chain/eth-bsc-swap-contracts/tree/audit1.0
- Testnet Faucet: https://testnet.binance.org/faucet-smart
- Local Network Setup: https://docs.binance.org/smart-chain/developer/deploy/local.html
- BScan: https://bscscan.com/
- PancakeSwap: https://pancakeswap.info/
- Venus: https://venus.io/

## Contracts / Tokens

- BSC Genesis Contract (TokenManager): https://testnet.bscscan.com/address/0x0000000000000000000000000000000000001008
- RelayerHub: https://bscscan.com/address/0x0000000000000000000000000000000000001006
- Binance Coin (WBNB): https://bscscan.com/token/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c
- PancakeSwap (Cake): https://bscscan.com/token/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82
- Venus (XVS): https://bscscan.com/token/0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63
- VAI Stablecoin (VAI): https://bscscan.com/token/0x4bd17003473389a42daf6a0a729f6fdb328bbbd7

### PancakeSwap

- MasterChef: https://bscscan.com/address/0x73feaa1ee314f8c655e354234017be2193c9e24e
- PancakeFactory: https://bscscan.com/address/0xBCfCcbde45cE874adCB698cC183deBcF17952812
- PancakeRouter: https://bscscan.com/address/0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F

Pool ID = 0: CAKE => CAKE
Pool ID = 1: CAKE/WBNB => CAKE

### Venus Protocol

- VAIVault (Storage): https://bscscan.com/address/0x7680c89eb3e58dec4d38093b4803be2b7f257360
- VAIVault (Proxy Impl): https://bscscan.com/address/0x0667Eed0a0aAb930af74a3dfeDD263A73994f216
