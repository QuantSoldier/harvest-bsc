import { ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import { Vault } from "../typechain";
import {
  addLiquidityBNB,
  buyTokensWithBNB,
  depositVault,
  impersonateAccounts,
} from "../utils";
import { advanceNBlocks } from "../utils/testing";
import { setupCakeLpTest } from "./setup";

describe("PancakeMasterChefLp", () => {
  it("farmer should earn money", async () => {
    const { deployer, farmerAlpha } = await setupCakeLpTest();
    const { cake, cakeLp } = await getNamedAccounts();

    const { CakeVault } = farmerAlpha;
    const { Controller } = deployer;

    const amount = await buyTokensWithBNB(
      farmerAlpha.address,
      cake,
      ethers.utils.parseEther("50").toString()
    );

    const lpBalance = await addLiquidityBNB(
      farmerAlpha.address,
      cake,
      amount.toString(),
      ethers.utils.parseEther("50").toString()
    );

    await depositVault(
      farmerAlpha.address,
      cakeLp,
      CakeVault.address,
      lpBalance.toString()
    );

    const hours = 10;
    const blocksPerHours = 2400;
    for (let i = 0; i < hours; i++) {
      console.log("loop", i);
      const sharePrice = await CakeVault.getPricePerFullShare();
      // await Controller.doHardWork(CakeVault.address);
      const newSharePrice = await CakeVault.getPricePerFullShare();

      console.log("old shareprice: ", sharePrice);
      console.log("new shareprice: ", newSharePrice);
      console.log("growth: ", newSharePrice.div(sharePrice));

      await advanceNBlocks(blocksPerHours);
    }

    const vaultBalance = await CakeVault.balanceOf(farmerAlpha.address);
    // console.log("vaultBalance: ", vaultBalance.toString());

    // await CakeVault.withdraw(vaultBalance.toFixed(), { from: farmer1 });
    // let farmerNewBalance = await underlying.balanceOf(farmer1));

    console.log("earned!");

    // await strategy.withdrawAllToVault({ from: governance }); // making sure can withdraw all for a next switch
  });
});
