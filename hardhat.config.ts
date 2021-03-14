import "dotenv/config";
import { HardhatUserConfig, task } from "hardhat/config";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-spdx-license-identifier";
import "hardhat-typechain";
import "@nomiclabs/hardhat-etherscan";
import secrets from "./secrets.json";

task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.6.12",
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
  etherscan: {
    apiKey: secrets.bscanKey || "",
  },
  namedAccounts: {
    deployer: 0,
    farmerAlpha: 1,
    farmerBeta: 2,
    token: {
      56: "0x58eDB145b4D9b268056dB1a60029C9Db20648350",
      97: "0x935f7Bc1ba9015cEbaE8d98D4B5F8Dae30a2E84d",
    },
    forwarder: {
      56: "",
      97: "0x314D178737D8F63a53f362a2145BBC2272537A02",
    },
    storage: {
      56: "",
      97: "0xff3b7e5Ff30fCd84CC2351f56F3e20397e54E52D",
    },
    controller: {
      56: "",
      97: "0x399C85c91Ad7Cdea4B9f8bd435EC2e1d03888801",
    },
    wbnb: {
      56: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
      97: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    },
    router: {
      56: "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F",
      97: "0xC250F711f9C7d662E6d119EAFECd04b49F071267",
    },
    factory: {
      56: "0xbcfccbde45ce874adcb698cc183debcf17952812",
      97: "0x5cc2d3253fd2db7949725f6cdbf474bc07a059e2",
    },
    chef: {
      56: "0x73feaa1ee314f8c655e354234017be2193c9e24e",
      97: "0x9F2Ecb21CD106fC4ad11c94B2b0f1E60dFDbeebc",
    },
    cake: {
      56: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
      97: "0xdE888574e20961649a3B2c801Dc6F7295a0f78b6",
    },
    cakeLp: {
      56: "0xA527a61703D82139F8a06Bc30097cC9CAA2df5A6",
      97: "",
    },
    syrup: {
      56: "",
      97: "0xE32f7b463248B63F5B36354b0DFF1220C2e0dbc5",
    },
    venus: {
      56: "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
      97: "",
    },
    comptroller: {
      56: "0xfD36E2c2a6789Db23113685031d7F16329158384",
      97: "",
    },
    dai: {
      56: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      97: "0xEC5dCb5Dbf4B114C9d0F65BcCAb49EC54F6A0867",
    },
    vdai: {
      56: "0x334b3eCB4DCa3593BCCC3c7EBD1A1C1d1780FBF1",
      97: "",
    },
    btcb: {
      56: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      97: "",
    },
    vbtc: {
      56: "0x882C173bC7Ff3b7786CA16dfeD3DFFfb9Ee7847B",
      97: "",
    },
    busd: {
      56: "",
      97: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      live: false,
    },
    hardhat: {
      chainId: 56,
      forking: {
        url: "https://bsc-dataseed1.ninicoin.io/",
      },
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: secrets.privateKey ? [`0x${secrets.privateKey}`] : [],
      live: false,
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
