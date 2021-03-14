import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, getNamedAccounts } from "hardhat";
import { setupCakeLpTest, setupCakeTest } from "./setup";

describe("PancakeMasterChefLp", () => {
  it("deploys the Cake Vault correctly", async () => {
    const { cake } = await getNamedAccounts();
    const { deployer } = await setupCakeTest();
    const { Vault } = deployer;

    const cakeGovernance = await Vault.governance();
    const cakeSymbol = await Vault.symbol();
    const cakeUnderlying = await Vault.underlying();
    const cakeUnderlyingUnit = await Vault.underlyingUnit();

    expect(cakeGovernance).eq(deployer.address);
    expect(cakeSymbol).eq("bfCake");
    expect(cakeUnderlying).eq(cake);
    expect(cakeUnderlyingUnit.toString()).eq(parseEther("1").toString());
  });

  it("deploys the Cake LP Vault correctly", async () => {
    const { cakeLp } = await getNamedAccounts();
    const { deployer } = await setupCakeLpTest();
    const { Vault } = deployer;

    const cakeLpGovernance = await Vault.governance();
    const cakeLpSymbol = await Vault.symbol();
    const cakeLpUnderlying = await Vault.underlying();
    const cakeLpUnderlyingUnit = await Vault.underlyingUnit();

    expect(cakeLpGovernance).eq(deployer.address);
    expect(cakeLpSymbol).eq("bfCake-LP");
    expect(cakeLpUnderlying).eq(cakeLp);
    expect(cakeLpUnderlyingUnit.toString()).eq(parseEther("1").toString());
  });

  it("deploys the Strategies correctly", async () => {
    const { cake, cakeLp, router } = await getNamedAccounts();
    const { deployer } = await setupCakeTest();
    const { Strategy, Vault } = deployer;

    const cakeRouter = await Strategy.pancakeswapRouterV2();

    const cakeGovernance = await Strategy.governance();
    const cakeController = await Strategy.controller();
    const cakeId = await Strategy.poolId();
    const cakeUnderlying = await Strategy.underlying();
    const cakeVault = await Strategy.vault();
    const cakeRewardToken = await Strategy.rewardToken();

    expect(cakeRouter).eq(router);
    expect(cakeGovernance).eq(deployer.address);
    expect(cakeController).eq(deployer.Controller.address);
    expect(cakeId).eq(0);
    expect(cakeUnderlying).eq(cake);
    // expect(cakeVault).eq(deployer.CakeVaultProxy.address);
    expect(cakeRewardToken).eq(cake);
  });
});
