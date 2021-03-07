import { BigNumber, BigNumberish } from "ethers";
import { deployments, getNamedAccounts } from "hardhat";
import { setupAccounts, setupCakeAccounts } from "../utils/account";

import * as chai from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
import { deployMasterChefStrategy, deployStrategyProxy, deployVault, deployVaultProxy } from "../utils/deploy";
chai.use(waffleChai);

export const setupDeployTest = deployments.createFixture(async () => {
  await deployments.fixture(["Storage", "Token", "Forwarder", "Controller"]);
  const accounts = await setupAccounts();
  return accounts;
});

export const setupCakeTest = deployments.createFixture(async () => {
  await deployments.fixture(["Storage", "Token", "Forwarder", "Controller"]);
  const accounts = await setupAccounts();
  const {cake, cakeLp} = await getNamedAccounts();

  const cakeVault = await deployVault(accounts.deployer.Storage.address, cake);
  const cakeVaultProxy = await deployVaultProxy(cakeVault);
  const cakeStrategy = await deployMasterChefStrategy(accounts.deployer.Storage.address, cake, cakeVaultProxy, 0);
  const cakeStrategyProxy = await deployStrategyProxy(cakeStrategy)

  const cakeLpVault = await deployVault(accounts.deployer.Storage.address, cake);
  const cakeLpVaultProxy = await deployVaultProxy(cakeLpVault);
  const cakeLpStrategy = await deployMasterChefStrategy(accounts.deployer.Storage.address, cakeLp, cakeLpVaultProxy, 1);
  const cakeLpStrategyProxy = await deployStrategyProxy(cakeLpStrategy)

  const cakeAccounts = await setupCakeAccounts(
    cakeVault, 
    cakeVaultProxy, 
    cakeStrategy, 
    cakeStrategyProxy, 
    cakeLpVault, 
    cakeLpVaultProxy,
    cakeLpStrategy,
    cakeLpStrategyProxy
  );

  return {
    deployer: {
      ...accounts.deployer,
      ...cakeAccounts.deployer
    }
  }
})