import { deployments, ethers, getNamedAccounts } from "hardhat";
import {
  PancakeMasterChefLPStrategy,
  StrategyProxy,
  Vault,
  VenusFoldStrategy,
  VenusWBNBFoldStrategy,
} from "../typechain";
import {
  getMasterChefStrategyAt,
  getStorage,
  getStorageAt,
  getStrategyAt,
  getVaultAt,
  getVenusFoldStrategyAt,
  getVenusWBNBFoldStrategyAt,
} from "./contracts";
import { logDeployEnd, logDeployStart } from "./log";

export const deployPool = async (
  farmToken: string,
  stakedToken: string,
  storage: string,
  vault: string,
  migrator: string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  logDeployStart("NoMintRewardPool", deployer);

  const result = await deploy("NoMintRewardPool", {
    log: true,
    from: deployer,
    args: [
      farmToken,
      stakedToken,
      604800,
      deployer, // rewardDistribution, initially deployer
      storage,
      vault,
      migrator,
    ],
  });

  logDeployEnd("NoMintRewardPool", result.address);

  return result.address;
};

export const deployMigrator = async (
  storage: string,
  underlying: string,
  oldVault: string,
  newVault: string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy("NoMintRewardPool", {
    log: true,
    from: deployer,
    args: [storage, underlying, oldVault, newVault],
  });

  return result.address;
};

export const deployMasterChefStrategyProxy = async (
  storage: string,
  vault: string,
  strategy: string,
  underlying: string,
  pid: number
) => {
  const { deploy } = deployments;
  const { deployer, cake, chef } = await getNamedAccounts();

  const result = await deploy("StrategyProxy", {
    log: true,
    from: deployer,
    args: [strategy],
  });

  const strategyProxy = (await ethers.getContractAt(
    "PancakeMasterChefLPStrategy",
    result.address,
    deployer
  )) as PancakeMasterChefLPStrategy;
  await strategyProxy
    .initializeStrategy(
      storage,
      underlying,
      vault, // vaultProxyAddress
      chef,
      cake,
      pid
    )
    .then((tx) => tx.wait());

  return result.address;
};

export const upgradeStrategyProxy = () => {};

export const deployVaultProxy = async (
  storage: string,
  vault: string,
  underlying: string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy("VaultProxy", {
    log: true,
    from: deployer,
    args: [vault],
  });

  const vaultProxy = (await ethers.getContractAt(
    "Vault",
    result.address,
    deployer
  )) as Vault;
  await vaultProxy
    .initializeVault(storage, underlying, 999, 1000)
    .then((tx) => tx.wait());

  return result.address;
};

export const upgradeVaultProxy = () => {};

export const deployVenusStrategyProxy = async (
  storage: string,
  vault: string,
  strategy: string,
  underlying: string,
  vtoken: string,
  collateralFactorNumerator: number,
  collateralFactorDenominator: number,
  folds: number,
  liquidationPath: string[]
) => {
  const { deploy } = deployments;
  const { deployer, comptroller, router, venus } = await getNamedAccounts();

  const result = await deploy("StrategyProxy", {
    log: true,
    from: deployer,
    args: [strategy],
  });

  const strategyProxy = (await ethers.getContractAt(
    "VenusFoldStrategy",
    result.address,
    deployer
  )) as VenusFoldStrategy;
  await strategyProxy
    .initializeStrategy(
      storage,
      underlying,
      vtoken,
      vault, // vaultProxyAddress
      comptroller,
      venus,
      router,
      collateralFactorNumerator,
      collateralFactorDenominator,
      folds,
      liquidationPath
    )
    .then((tx) => tx.wait());

  return result.address;
};

export const deployVenusWBNBStrategyProxy = async (
  storage: string,
  vault: string,
  strategy: string,
  underlying: string,
  vtoken: string,
  collateralFactorNumerator: number,
  collateralFactorDenominator: number,
  folds: number
) => {
  const { deploy } = deployments;
  const { deployer, comptroller, router, venus } = await getNamedAccounts();

  const result = await deploy("StrategyProxy", {
    log: true,
    from: deployer,
    args: [strategy],
  });

  const strategyProxy = (await ethers.getContractAt(
    "VenusWBNBFoldStrategy",
    result.address,
    deployer
  )) as VenusWBNBFoldStrategy;
  await strategyProxy
    .initializeStrategy(
      storage,
      underlying,
      vtoken,
      vault, // vaultProxyAddress
      comptroller,
      venus,
      router,
      collateralFactorNumerator,
      collateralFactorDenominator,
      folds
    )
    .then((tx) => tx.wait());

  return result.address;
};
