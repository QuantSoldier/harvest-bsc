import { ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
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

    const { Vault } = farmerAlpha;
    const { Controller, Strategy } = deployer;

    await Strategy.setSellFloor(0);

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
      Vault.address,
      lpBalance.toString()
    );

    const hours = 10;
    const blocksPerHours = 2400;
    for (let i = 0; i < hours; i++) {
      console.log("loop", i);
      const sharePrice = await Vault.getPricePerFullShare();
      await Controller.doHardWork(Vault.address);
      const newSharePrice = await Vault.getPricePerFullShare();

      console.log("old shareprice: ", sharePrice.toString());
      console.log("new shareprice: ", newSharePrice.toString());
      console.log("growth: ", newSharePrice.div(sharePrice).toString());

      await advanceNBlocks(blocksPerHours);
    }

    const vaultBalance = await Vault.balanceOf(farmerAlpha.address);
    // console.log("vaultBalance: ", vaultBalance.toString());

    // await CakeVault.withdraw(vaultBalance.toFixed(), { from: farmer1 });
    // let farmerNewBalance = await underlying.balanceOf(farmer1));

    console.log("earned!");

    // await strategy.withdrawAllToVault({ from: governance }); // making sure can withdraw all for a next switch
  });
});
