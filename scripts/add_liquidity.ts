import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { PancakeMasterChefLPStrategy, Storage, Vault } from "../typechain";
import { deployMigrator, deployPool, deployStrategyProxy, deployVault, deployVaultProxy } from "../utils/deploy";
import { addLiquidityBNB } from "../utils/swap";

const main = async () => {
  const { deployer, cake, router } = await getNamedAccounts();

  await addLiquidityBNB(
    router,
    deployer,
    cake,
    ethers.utils.parseEther("50").toString(),
    ethers.utils.parseEther("1").toString()
  ) 
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });