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

  // only deploy the mock token on non-live networks
  if (!network.live) {
    const result = await deploy("RewardToken", {
      log: true,
      from: deployer,
    });

    if (result.newlyDeployed) {
    }
  }
};

export default func;
func.tags = ["Token", "Setup"];
