import { BigNumber, BigNumberish } from "ethers";
import { deployments, getNamedAccounts } from "hardhat";
import { setupAccounts } from "../utils/account";
import {
  deployMasterChefStrategyProxy,
  deployVaultProxy,
} from "../utils/deploy";

import * as chai from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
import { getMasterChefStrategyAt, getVaultAt } from "../utils/contracts";
chai.use(waffleChai);

export const setupDeployTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const accounts = await setupAccounts();
  return accounts;
});

export const setupCakeTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Storage, Vault, MasterChefStrategy } = deployer;
  const { cake } = await getNamedAccounts();

  const cakeVaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    cake
  );
  const cakeStrategyProxy = await deployMasterChefStrategyProxy(
    Storage.address,
    Vault.address,
    MasterChefStrategy.address,
    cake,
    0
  );

  const CakeVault = await getVaultAt(cakeVaultProxy, deployer.address);
  const CakeStrategy = await getMasterChefStrategyAt(
    cakeStrategyProxy,
    deployer.address
  );

  return {
    deployer: {
      ...deployer,
      CakeVault,
      CakeStrategy,
    },
  };
});

export const setupCakeLpTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Storage, Vault, MasterChefStrategy } = deployer;
  const { cakeLp } = await getNamedAccounts();

  const cakeVaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    cakeLp
  );
  const cakeStrategyProxy = await deployMasterChefStrategyProxy(
    Storage.address,
    Vault.address,
    MasterChefStrategy.address,
    cakeLp,
    1
  );

  const CakeVault = await getVaultAt(cakeVaultProxy, deployer.address);
  const CakeStrategy = await getMasterChefStrategyAt(
    cakeStrategyProxy,
    deployer.address
  );

  return {
    deployer: {
      ...deployer,
      CakeVault,
      CakeStrategy,
    },
  };
});
