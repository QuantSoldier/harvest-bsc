import { BigNumber, BigNumberish } from "ethers";
import { deployments, getNamedAccounts } from "hardhat";
import { setupAccounts } from "../utils/account";
import {
  deployMasterChefStrategyProxy,
  deployVaultProxy,
  deployVenusStrategyProxy,
  deployVenusWBNBStrategyProxy,
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
    cakeVaultProxy,
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
    cakeVaultProxy,
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

export const setupVenusTest = deployments.createFixture(async () => {
  await deployments.fixture();
  const { deployer } = await setupAccounts();
  const { Storage, Vault, VenusFoldStrategy } = deployer;
  const { dai, btcb, vdai, vbtc, wbnb, venus } = await getNamedAccounts();

  const daiVaultProxy = await deployVaultProxy(
    Storage.address,
    Vault.address,
    dai
  );
  const daiStrategyProxy = await deployVenusStrategyProxy(
    Storage.address,
    daiVaultProxy,
    VenusFoldStrategy.address,
    dai,
    vdai,
    500,
    1000,
    5,
    [venus, wbnb, dai]
  );

  // const btcbVaultProxy = await deployVaultProxy(
  //   Storage.address,
  //   Vault.address,
  //   btcb
  // );
  // const btcbStrategyProxy = await deployVenusStrategyProxy(
  //   Storage.address,
  //   btcbVaultProxy,
  //   VenusFoldStrategy.address,
  //   btcb,
  //   vbtc,
  //   300,
  //   1000,
  //   5,
  //   [venus, wbnb, btcb]
  // );

  const DaiVault = await getVaultAt(daiVaultProxy, deployer.address);
  const DaiStrategy = await getMasterChefStrategyAt(
    daiStrategyProxy,
    deployer.address
  );

  // const BtcbVault = await getVaultAt(btcbVaultProxy, deployer.address);
  // const BtcbStrategy = await getMasterChefStrategyAt(
  //   btcbStrategyProxy,
  //   deployer.address
  // );

  return {
    deployer: {
      ...deployer,
      DaiVault,
      DaiStrategy,
      // BtcbVault,
      // BtcbStrategy,
    },
  };
});
