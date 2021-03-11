import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, getNamedAccounts } from "hardhat";
import { setupVenusTest } from "./setup";

describe("VenusFoldStrategy", () => {
  it("deploys the dai vault correctly", async () => {
    const { dai } = await getNamedAccounts();
    const { deployer } = await setupVenusTest();
    const { DaiVault } = deployer;

    const daiGovernance = await DaiVault.governance();
    const daiSymbol = await DaiVault.symbol();
    const daiUnderlying = await DaiVault.underlying();
    const daiUnderlyingUnit = await DaiVault.underlyingUnit();

    expect(daiGovernance).eq(deployer.address);
    expect(daiSymbol).eq("bfDAI");
    expect(daiUnderlying).eq(dai);
    expect(daiUnderlyingUnit.toString()).eq(parseEther("1").toString());


  });

  // it("deploys the btcb vault correctly", async () => {
  //   const { btcb } = await getNamedAccounts();
  //   const { deployer } = await setupVenusTest();
  //   const { BtcbVault } = deployer;
  //
  //   const btcbGovernance = await BtcbVault.governance();
  //   const btcbSymbol = await BtcbVault.symbol();
  //   const btcbUnderlying = await BtcbVault.underlying();
  //   const btcbUnderlyingUnit = await BtcbVault.underlyingUnit();
  //
  //   expect(btcbGovernance).eq(deployer.address);
  //   expect(btcbSymbol).eq("bfBtcb");
  //   expect(btcbUnderlying).eq(btcb);
  //   expect(btcbUnderlyingUnit.toString()).eq(parseEther("1").toString());
  // });

  it("deploys the dai strategy correctly", async () => {
    const { dai, vdai, router, venus } = await getNamedAccounts();
    const { deployer } = await setupVenusTest();
    const { DaiStrategy, DaiVault } = deployer;

    const daiRouter = await DaiStrategy.pancakeswapRouterV2();
    const daiGovernance = await DaiStrategy.governance();
    const daiController = await DaiStrategy.controller();
    const daiUnderlying = await DaiStrategy.underlying();
    const daiRewardToken = await DaiStrategy.rewardToken();

    expect(daiRouter).eq(router);
    expect(daiGovernance).eq(deployer.address);
    expect(daiController).eq(deployer.Controller.address);
    expect(daiUnderlying).eq(dai);
    expect(daiRewardToken).eq(venus);
  });

  // it("deploys the btcb strategy correctly", async () => {
  //   const { btcb, vbtc, router, venus } = await getNamedAccounts();
  //   const { deployer } = await setupVenusTest();
  //   const { BtcbStrategy, BtcbVault } = deployer;
  //
  //   const btcbRouter = await BtcbStrategy.pancakeswapRouterV2();
  //   const btcbGovernance = await BtcbStrategy.governance();
  //   const btcbController = await BtcbStrategy.controller();
  //   const btcbUnderlying = await BtcbStrategy.underlying();
  //   const btcbRewardToken = await BtcbStrategy.rewardToken();
  //
  //   expect(btcbRouter).eq(router);
  //   expect(btcbGovernance).eq(deployer.address);
  //   expect(btcbController).eq(deployer.Controller.address);
  //   expect(btcbUnderlying).eq(btcb);
  //   expect(btcbRewardToken).eq(venus);
  // });

});
