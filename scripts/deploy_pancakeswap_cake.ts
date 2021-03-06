import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { PancakeMasterChefLPStrategy, Storage, Vault } from "../typechain";
import { deployMigrator, deployPool, deployStrategyProxy, deployVault, deployVaultProxy } from "../utils/deploy";

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

  const strategyResult = await deploy('PancakeMasterChefLPStrategy', {
    log: true,
    from: deployer
  })

  if (strategyResult.newlyDeployed) {
    const strategy = await ethers.getContractAt('PancakeMasterChefLPStrategy', strategyResult.address, deployer) as PancakeMasterChefLPStrategy;

    await strategy.initializeStrategy(
      storage.address,
      cakeLp,
      vaultAddress, // vaultProxyAddress
      chef,
      cake,
      1
    )

    const proxyAddress = await deployStrategyProxy(strategyResult.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });