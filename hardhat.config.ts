import "dotenv/config";
import { HardhatUserConfig, task } from "hardhat/config";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-spdx-license-identifier";
import "hardhat-typechain";
import secrets from "./secrets.json";

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.5.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    artifacts: "./build/artifacts",
    cache: "./build/cache",
    deployments: "./deployments",
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
  mocha: {
    timeout: 1200000,
  },
  namedAccounts: {
    deployer: 0,
    pancake: {
      56: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
      97: "",
    },
    venus: {
      56: "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
      97: "",
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    hardhat: {
      chainId: 56,
      forking: {
        // blockNumber: 4895000,
        url: "https://bsc-dataseed1.ninicoin.io/",
      },
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: { mnemonic: secrets.mnemonic },
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: { mnemonic: secrets.mnemonic },
    },
  },
};

export default config;
