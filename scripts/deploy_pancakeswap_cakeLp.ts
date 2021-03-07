import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { PancakeMasterChefLPStrategy, Storage, Vault } from "../typechain";
import { deployMasterChefStrategy, deployMigrator, deployPool, deployStrategyProxy, deployVault, deployVaultProxy } from "../utils/deploy";

const main = async () => {
  const { deploy } = deployments
  const { deployer, token, cake, cakeLp, chef } = await getNamedAccounts();
  const storage = (await ethers.getContract("Storage", deployer)) as Storage;

  const vaultAddress = await deployVault(storage.address, cakeLp);
  const vaultProxyAddress = await deployVaultProxy(vaultAddress);
  
  // const migratorAddress = await deployMigrator(storage.address, cakeLp, )
  const poolAddress = await deployPool(
    token, 
    vaultProxyAddress, 
    storage.address,
    vaultAddress,
    deployer // migrator ? 
  )

  const strategyAddress = await deployMasterChefStrategy(storage.address, cakeLp, vaultProxyAddress, 1)
  const proxyAddress = await deployStrategyProxy(strategyAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });