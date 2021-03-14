import { ethers } from "hardhat";

export const advanceNBlocks = async (n: number) => {
  await ethers.provider.send("evm_increaseTime", [n * 15]);

  for (let i = 0; i < n; i++) {
    await ethers.provider.send("evm_mine", []);
  }
};
