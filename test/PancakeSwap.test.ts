import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, getNamedAccounts } from "hardhat";
import { setupCakeLpTest, setupCakeTest } from "./setup";

describe("PancakeMasterChefLp", () => {
  it("deploys the Cake Vault correctly", async () => {
    const { cake } = await getNamedAccounts();
    const { deployer } = await setupCakeTest();
    const { CakeVault } = deployer;

    const cakeGovernance = await CakeVault.governance();
    const cakeSymbol = await CakeVault.symbol();
    const cakeUnderlying = await CakeVault.underlying();
    const cakeUnderlyingUnit = await CakeVault.underlyingUnit();

    expect(cakeGovernance).eq(deployer.address);
    expect(cakeSymbol).eq("bfCake");
    expect(cakeUnderlying).eq(cake);
    expect(cakeUnderlyingUnit.toString()).eq(parseEther("1").toString());
  });

  it("deploys the Cake LP Vault correctly", async () => {
    const { cakeLp } = await getNamedAccounts();
    const { deployer } = await setupCakeLpTest();
    const { CakeVault } = deployer;

    const cakeLpGovernance = await CakeVault.governance();
    const cakeLpSymbol = await CakeVault.symbol();
    const cakeLpUnderlying = await CakeVault.underlying();
    const cakeLpUnderlyingUnit = await CakeVault.underlyingUnit();

    expect(cakeLpGovernance).eq(deployer.address);
    expect(cakeLpSymbol).eq("bfCake-LP");
    expect(cakeLpUnderlying).eq(cakeLp);
    expect(cakeLpUnderlyingUnit.toString()).eq(parseEther("1").toString());
  });

  it("deploys the Strategies correctly", async () => {
    const { cake, cakeLp, router } = await getNamedAccounts();
    const { deployer } = await setupCakeTest();
    const { CakeStrategy, CakeVault } = deployer;

    const cakeRouter = await CakeStrategy.pancakeswapRouterV2();

    const cakeGovernance = await CakeStrategy.governance();
    const cakeController = await CakeStrategy.controller();
    const cakeId = await CakeStrategy.poolId();
    const cakeUnderlying = await CakeStrategy.underlying();
    const cakeVault = await CakeStrategy.vault();
    const cakeRewardToken = await CakeStrategy.rewardToken();

    expect(cakeRouter).eq(router);
    expect(cakeGovernance).eq(deployer.address);
    expect(cakeController).eq(deployer.Controller.address);
    expect(cakeId).eq(0);
    expect(cakeUnderlying).eq(cake);
    // expect(cakeVault).eq(deployer.CakeVaultProxy.address);
    expect(cakeRewardToken).eq(cake);
  });
});
