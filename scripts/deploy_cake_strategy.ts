import { ethers, getNamedAccounts, network, upgrades } from "hardhat";
import { Storage, Vault } from "../typechain";

const VAULT_ADDRESS = "";

const main = async () => {
  const { deployer, cake, cakeLp, chef } = await getNamedAccounts();
  const storage = (await ethers.getContract("Storage", deployer)) as Storage;
  const vault = await ethers.getContractAt('Vault', VAULT_ADDRESS, deployer) as Vault;

  const strategyFactory = await ethers.getContractFactory('PancakeMasterChefLPStrategy', deployer);
  const vaultDeployment = await upgrades.deployProxy(strategyFactory, [
    storage.address,
    cakeLp,
    vault.address,
    chef,
    cake,
    1
  ]);

  console.log(`Deploying CAKE/WBNB LP Vault at tx ${vaultDeployment.deployTransaction.hash}...`)
  await vaultDeployment.deployed();
  console.log(`Deployed Vault at ${vaultDeployment.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });