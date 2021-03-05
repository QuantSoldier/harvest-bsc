import { ethers, getNamedAccounts, upgrades } from "hardhat";
import { Storage } from "../typechain";

const main = async () => {
  const { deployer, cakeLp } = await getNamedAccounts();
  const storage = (await ethers.getContract("Storage", deployer)) as Storage;

  const vaultFactory = await ethers.getContractFactory('Vault', deployer);
  const vaultDeployment = await upgrades.deployProxy(vaultFactory, [
    storage.address,
    cakeLp,
    999,
    1000
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