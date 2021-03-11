import { DeployFunction } from "hardhat-deploy/types";
import { run } from "hardhat";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy("Vault", {
    log: true,
    from: deployer,
  });

  if (result.newlyDeployed) {
    await run("verify:verify", {
      address: result.address,
    })
  }
};

export default func;
func.tags = ["Vault", "Mainnet", "Testnet"];
