import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy('Storage', {
    log: true,
    from: deployer
  })

  if (result.newlyDeployed) {
    //
  }
}

export default func;
func.tags = ["Storage"]