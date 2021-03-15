import * as chai from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
chai.use(waffleChai);

import { deployments, ethers, getNamedAccounts } from "hardhat";
import {
  deployMasterChefStrategyProxy,
  deployVaultProxy,
  deployVenusStrategyProxy,
  deployVenusWBNBStrategyProxy,
  setupAccounts,
  setupStrategyAccounts,
  addPancakeSwapLiquidationRoute,
  addVaultAndStrategy,
} from "../utils";

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
    0,
    false
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
  const { cakeLp, cake, wbnb } = await getNamedAccounts();

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
    1,
    true
  );

  await addVaultAndStrategy(
    Controller.address,
    deployer.address,
    cakeVaultProxy,
    cakeStrategyProxy
  );

  await addPancakeSwapLiquidationRoute(
    cakeStrategyProxy,
    deployer.address,
    [],
    [cake, wbnb]
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
    0,
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
    3
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
