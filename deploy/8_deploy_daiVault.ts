import { DeployFunction } from "hardhat-deploy/types";
import { Vault, Storage, VaultProxy } from "../typechain";
import { run } from "hardhat";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer, dai } = await getNamedAccounts();
  const vault = (await ethers.getContract("Vault", deployer)) as Vault;
  const storage = (await ethers.getContract("Storage", deployer)) as Storage;

  const result = await deploy("VaultProxy", {
    log: true,
    from: deployer,
    args: [vault.address],
  });

  const daiVault = await ethers.getContractAt("Vault", result.address, deployer) as Vault;

  if (result.newlyDeployed) {
    await daiVault.initializeVault(storage.address, dai, 999, 1000).then((tx) => tx.wait());
    await run("verify:verify", {
      address: result.address,
      constructorArguments: [vault.address],
    })
  }
};

export default func;
func.tags = ["VaultProxy", "Mainnet", "Testnet"];
