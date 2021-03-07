import { deployments, ethers, getNamedAccounts } from "hardhat";
import { getMasterChefStrategyAt, getStorage, getStorageAt, getStrategyAt, getVaultAt } from "./contracts";
import { logDeployEnd, logDeployStart } from "./log";

export const deployPool = async (
  farmToken:string,
  stakedToken:string,
  storage:string,
  vault:string,
  migrator:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  logDeployStart('NoMintRewardPool', deployer)

  const result = await deploy('NoMintRewardPool', {
    log: true,
    from: deployer,
    args: [
      farmToken,
      stakedToken,
      604800,
      deployer, // rewardDistribution, initially deployer
      storage,
      vault,
      migrator
    ]
  })

  logDeployEnd('NoMintRewardPool', result.address)

  return result.address;
}

export const deployMigrator = async (
  storage:string,
  underlying:string,
  oldVault:string,
  newVault:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy('NoMintRewardPool', {
    log: true,
    from: deployer,
    args: [
      storage,
      underlying,
      oldVault,
      newVault
    ]
  })

  return result.address;
}

export const deployMasterChefStrategy = async (
  storage:string,
  underlying:string,
  vault:string,
  pid:number
  // yieldContract:string,
  // yieldToken:string
) => {
  const { deploy } = deployments;
  const { deployer, cake, chef } = await getNamedAccounts();

  // Use Proxy deployment to upgrade
  const result = await deploy('PancakeMasterChefLPStrategy', {
    log: true,
    from: deployer
  })

  if (result.newlyDeployed) {
    const strategy = await getMasterChefStrategyAt(result.address, deployer);

    await strategy.initializeStrategy(
      storage,
      underlying,
      vault, // vaultProxyAddress
      chef,
      cake, // cake
      pid
    ).then(tx => tx.wait())
  }

  return result.address
}

export const deployStrategyProxy = async (
  implementation:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Use Proxy deployment to upgrade
  const result = await deploy('StrategyProxy', {
    log: true,
    from: deployer,
    args: [implementation]
  })

  return result.address;
}

export const upgradeStrategyProxy = () => {
  
}

export const deployVault = async (
  storage:string,
  underlying:string,
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  logDeployStart('Vault', deployer);

  // Use Proxy deployment to upgrade

  const factory = await ethers.getContractFactory('Vault', deployer);
  const result = await factory.deploy()
  await result.deployed();

  logDeployEnd('Vault', result.address);

  // if (result.newlyDeployed) {
    const vault = await getVaultAt(result.address, deployer);

    await vault.initializeVault(
      storage,
      underlying,
      999,
      1000
    ).then(tx => tx.wait())
  // }
  

  return result.address
}

export const deployVaultProxy = async (
  implementation:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  logDeployStart('VaultProxy', deployer);

  // Use Proxy deployment to upgrade
  const result = await deploy('VaultProxy', {
    log: true,
    from: deployer,
    args: [implementation]
  })

  logDeployEnd('VaultProxy', result.address)

  return result.address;
}

export const upgradeVaultProxy = () => {

}