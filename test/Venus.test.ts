import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, getNamedAccounts } from "hardhat";
import { setupVenusTest } from "./setup";

describe("VenusFoldStrategy", () => {

  it("deploys the dai vault correctly", async () => {
    const { dai } = await getNamedAccounts();
    const { deployer } = await setupVenusTest();
    const { Vault } = deployer;

    const daiGovernance = await Vault.governance();
    const daiSymbol = await Vault.symbol();
    const daiUnderlying = await Vault.underlying();
    const daiUnderlyingUnit = await Vault.underlyingUnit();

    expect(daiGovernance).eq(deployer.address);
    expect(daiSymbol).eq("bfDAI");
    expect(daiUnderlying).eq(dai);
    expect(daiUnderlyingUnit.toString()).eq(parseEther("1").toString());
  });

  it("deploys the dai strategy correctly", async () => {
    const { dai, vdai, router, venus } = await getNamedAccounts();
    const { deployer } = await setupVenusTest();
    const { Strategy, Vault } = deployer;

    const daiRouter = await Strategy.pancakeswapRouterV2();
    const daiGovernance = await Strategy.governance();
    const daiController = await Strategy.controller();
    const daiUnderlying = await Strategy.underlying();
    const daiRewardToken = await Strategy.rewardToken();

    expect(daiRouter).eq(router);
    expect(daiGovernance).eq(deployer.address);
    expect(daiController).eq(deployer.Controller.address);
    expect(daiUnderlying).eq(dai);
    expect(daiRewardToken).eq(venus);
  });
});
