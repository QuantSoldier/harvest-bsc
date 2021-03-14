import { ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import { expect } from "chai";
import {
  buyTokensWithBNB,
  depositVault,
  impersonateAccounts,
  getBEP20At,
  getRouterAt,
  wrapBNB,
} from "../utils";
import { advanceNBlocks } from "../utils/testing";
import { setupVenusWBNBTest } from "./setup";

describe("Venus WBNB Strategy", () => {
  it("farmer should earn money", async () => {
    const { wbnb, vbnb, router } = await getNamedAccounts();
    const { deployer, farmerAlpha } = await setupVenusWBNBTest();

    const { Vault } = farmerAlpha;
    const { Controller, Strategy } = deployer;

    const underlying = await getBEP20At(wbnb, farmerAlpha.address);
    await Strategy.setSellFloor(0);

    const value = await ethers.utils.parseEther("100").toString();
    const amount = await wrapBNB(farmerAlpha.address, value);

    await depositVault(
      farmerAlpha.address,
      wbnb,
      Vault.address,
      amount.toString()
    );

    var vaultBalance = await Vault.balanceOf(farmerAlpha.address);

    const hours = 10;
    const blocksPerHours = 14400;
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

    vaultBalance = await Vault.balanceOf(farmerAlpha.address);
    console.log("vaultBalance: ", vaultBalance.toString());

    await Vault.withdraw(vaultBalance.toString());
    const farmerNewBalance = await underlying.balanceOf(farmerAlpha.address);

    expect(farmerNewBalance).above(amount);
    console.log("earned!");
  });
});
