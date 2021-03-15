import { ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import {
  addLiquidityBNB,
  buyTokensWithBNB,
  depositVault,
  impersonateAccounts,
} from "../utils";
import { advanceNBlocks } from "../utils/testing";
import { setupCakeLpTest, setupCakeTest } from "./setup";

describe("MasterChefStrategy", () => {
  describe("Cake/WBNB LP Vault", () => {
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
      console.log("vaultBalance: ", vaultBalance.toString());

      await Vault.withdraw(vaultBalance.toString());
      const farmerNewBalance = await Vault.balanceOf(farmerAlpha.address);

      console.log("earned!");

      await Strategy.withdrawAllToVault(); // making sure can withdraw all for a next switch
    });
  });

  describe("Cake Single Asset Vault", () => {
    it("farmer should earn money", async () => {
      const { deployer, farmerAlpha } = await setupCakeTest();
      const { cake } = await getNamedAccounts();

      const { Vault } = farmerAlpha;
      const { Controller, Strategy } = deployer;

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
      console.log("vaultBalance: ", vaultBalance.toString());

      await Vault.withdraw(vaultBalance.toString());
      const farmerNewBalance = await Vault.balanceOf(farmerAlpha.address);

      console.log("earned!");

      await Strategy.withdrawAllToVault(); // making sure can withdraw all for a next switch
    });
  });
});
