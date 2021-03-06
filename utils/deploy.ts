import { deployments, getNamedAccounts } from "hardhat";
import { getStorage, getStorageAt, getStrategyAt, getVaultAt } from "./contracts";

export const deployPool = async (
  farmToken:string,
  stakedToken:string,
  storage:string,
  vault:string,
  migrator:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

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

export const deployStrategy = async (
  strategy:string,
  storage:string,
  underlying:string,
  vault:string,
  yieldContract:string,
  yieldToken:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Use Proxy deployment to upgrade
  const result = await deploy(strategy, {
    log: true,
    from: deployer,  
  })
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

  // Use Proxy deployment to upgrade
  const result = await deploy('Vault', {
    log: true,
    from: deployer,  
  })

  if (result.newlyDeployed) {
    const vault = await getVaultAt(result.address, deployer);

    await vault.initializeVault(
      storage,
      underlying,
      999,
      1000
    ).then(tx => tx.wait())
  }

  return result.address
}

export const deployVaultProxy = async (
  implementation:string
) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Use Proxy deployment to upgrade
  const result = await deploy('VaultProxy', {
    log: true,
    from: deployer,
    args: [implementation]
  })

  return result.address;
}

export const upgradeVaultProxy = () => {

}