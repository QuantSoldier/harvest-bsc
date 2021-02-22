import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const storage = await ethers.getContract('Storage', deployer) as Storage;
  const token = await ethers.getContract('bFARM', deployer) as bFARM;

  const result = await deploy('FeeRewardForwarder', {
    log: true,
    from: deployer,
    args: [storage.address, token.address]
  })

  if (result.newlyDeployed) {
    //
  }
}

export default func;
func.tags = ["Forwarder"]