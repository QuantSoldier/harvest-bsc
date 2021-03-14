import { BigNumber, BigNumberish } from "ethers";
import { deployments, getNamedAccounts } from "hardhat";
import { setupAccounts, setupStrategyAccounts } from "../utils/account";
import {
  deployMasterChefStrategyProxy,
  deployVaultProxy,
  deployVenusStrategyProxy,
  deployVenusWBNBStrategyProxy,
} from "../utils/deploy";

import * as chai from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
import {
  getMasterChefStrategyAt,
  getVaultAt,
  getVenusFoldStrategyAt,
} from "../utils/contracts";
import { addVaultAndStrategy } from "../utils";
chai.use(waffleChai);

export const setupDeployTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const accounts = await setupAccounts();
  return accounts;
});

export const setupCakeTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Controller, Storage, Vault, MasterChefStrategy } = deployer;
  const { cake } = await getNamedAccounts();

  const cakeVaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    cake
  );
  const cakeStrategyProxy = await deployMasterChefStrategyProxy(
    Storage.address,
    cakeVaultProxy,
    MasterChefStrategy.address,
    cake,
    0
  );

  await addVaultAndStrategy(
    Controller.address,
    deployer.address,
    cakeVaultProxy,
    cakeStrategyProxy
  );

  const strategyAccounts = await setupStrategyAccounts(
    cakeVaultProxy,
    cakeStrategyProxy
  );
  return strategyAccounts;
});

export const setupCakeLpTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Controller, Storage, Vault, MasterChefStrategy } = deployer;
  const { cakeLp } = await getNamedAccounts();

  const cakeVaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    cakeLp
  );
  const cakeStrategyProxy = await deployMasterChefStrategyProxy(
    Storage.address,
    cakeVaultProxy,
    MasterChefStrategy.address,
    cakeLp,
    1
  );

  await addVaultAndStrategy(
    Controller.address,
    deployer.address,
    cakeVaultProxy,
    cakeStrategyProxy
  );

  const strategyAccounts = await setupStrategyAccounts(
    cakeVaultProxy,
    cakeStrategyProxy
  );
  return strategyAccounts;
});

export const setupVenusTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Controller, Storage, Vault, VenusFoldStrategy } = deployer;
  const { dai, vdai, wbnb, venus } = await getNamedAccounts();

  const vaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    dai
  );
  const strategyProxy = await deployVenusStrategyProxy(
    Storage.address,
    vaultProxy,
    VenusFoldStrategy.address,
    dai,
    vdai,
    500,
    1000,
    1,
    [venus, wbnb, dai]
  );

  await addVaultAndStrategy(
    Controller.address,
    deployer.address,
    vaultProxy,
    strategyProxy
  );

  const strategyAccounts = await setupStrategyAccounts(
    vaultProxy,
    strategyProxy
  );
  return strategyAccounts;
});

export const setupVenusWBNBTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Controller, Storage, Vault, VenusWBNBFoldStrategy } = deployer;
  const { wbnb, vbnb, venus } = await getNamedAccounts();

  const vaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    wbnb
  );
  const strategyProxy = await deployVenusWBNBStrategyProxy(
    Storage.address,
    vaultProxy,
    VenusWBNBFoldStrategy.address,
    wbnb,
    vbnb,
    500,
    1000,
    0,
  );

  await addVaultAndStrategy(
    Controller.address,
    deployer.address,
    vaultProxy,
    strategyProxy
  );

  const strategyAccounts = await setupStrategyAccounts(
    vaultProxy,
    strategyProxy
  );
  return strategyAccounts;
});
