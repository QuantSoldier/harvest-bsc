import { ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import { BigNumber } from "bignumber.js"
import { expect } from "chai";
import {
  buyTokensWithBNB,
  depositVault,
  impersonateAccounts,
  getBEP20At,
  getVAIVaultAt,
} from "../utils";
import { advanceNBlocks } from "../utils/testing";
import { setupVenusVaiTest } from "./setup";

describe("Venus VAI Strategy", () => {
  it("farmer should earn money", async () => {
    const { vai, venus, vvaiVault } = await getNamedAccounts();
    const { deployer, farmerAlpha } = await setupVenusVaiTest();

    const { Vault } = farmerAlpha;
    const { Controller, Strategy } = deployer;

    const accounts = await getUnnamedAccounts();
    const mockXVSDistributor = accounts[0];
    const vvaiVaultContract = await getVAIVaultAt(vvaiVault, mockXVSDistributor);

    const underlying = await getBEP20At(vai, farmerAlpha.address);
    const venusToken = await getBEP20At(venus, mockXVSDistributor);
    await Strategy.setSellFloor(0);

    const venusAmount = await buyTokensWithBNB(
      mockXVSDistributor,
      venus,
      ethers.utils.parseEther("500").toString()
    );

    const amount = await buyTokensWithBNB(
      farmerAlpha.address,
      vai,
      ethers.utils.parseEther("100").toString()
    );

    await depositVault(
      farmerAlpha.address,
      vai,
      Vault.address,
      amount.toString()
    );

    var vaultBalance = await Vault.balanceOf(farmerAlpha.address);

    const hours = 10;
    const blocksPerHours = 2400;
    for (let i = 0; i < hours; i++) {
      console.log("loop", i);

      //Distribution for 1250 XVS per day, 3 second block time
      const distributionAmount = 1250/(24*1200)*blocksPerHours;
      const distributionAmountBN = ethers.utils.parseEther(distributionAmount.toString())

      await venusToken.approve(vvaiVault, distributionAmountBN).then((tx) => tx.wait());
      await venusToken.transfer(vvaiVault, distributionAmountBN).then((tx) => tx.wait());

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

    await Strategy.withdrawAllToVault(); // making sure can withdraw all for a next switch
  });
});
