import { expect } from "chai";
import { ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import {
  buyTokensWithBNB,
  depositVault,
  getBEP20At,
} from "../utils";
import { advanceNBlocks } from "../utils/testing";
import { setupCakeTest, setupDeployTest } from "./setup";


describe("FeeRewardForwarder", () => {
  it("should deploy and setup correctly", async () => {
    const { deployer } = await setupDeployTest();
    const { Forwarder } = deployer;

    const governance = await Forwarder.governance();

    expect(governance).eq(deployer.address);
  });

  it("Forward fees to EOA", async () => {
    const { deployer, farmerAlpha } = await setupCakeTest();
    const { cake, eoa, eth } = await getNamedAccounts();

    const ethContract = await getBEP20At(eth, deployer.address);

    const { Vault } = farmerAlpha;
    const { Controller, Strategy, Forwarder } = deployer;

    await Forwarder.setEOA(eoa);

    await Strategy.setSellFloor(0);

    const amount = await buyTokensWithBNB(
      farmerAlpha.address,
      cake,
      ethers.utils.parseEther("100").toString()
    );

    await depositVault(
      farmerAlpha.address,
      cake,
      Vault.address,
      amount.toString()
    );

    const hours = 5;
    const blocksPerHours = 2400;
    for (let i = 0; i < hours; i++) {
      console.log("loop", i);
      const feeBalanceBefore = await ethContract.balanceOf(eoa);
      const sharePrice = await Vault.getPricePerFullShare();
      await Controller.doHardWork(Vault.address);
      const newSharePrice = await Vault.getPricePerFullShare();
      const feeBalanceAfter = await ethContract.balanceOf(eoa);

      const feeForwarded = feeBalanceAfter.sub(feeBalanceBefore).toString();

      console.log("old shareprice: ", sharePrice.toString());
      console.log("new shareprice: ", newSharePrice.toString());
      console.log("growth: ", newSharePrice.div(sharePrice).toString());
      console.log("fee forwarded: ", feeForwarded.toString());

      await advanceNBlocks(blocksPerHours);
    }
    const feeBalance = await ethContract.balanceOf(eoa);
    expect(feeBalance).above(0);
    console.log("Total fees forwarded:", feeBalance.toString());
  })
});
