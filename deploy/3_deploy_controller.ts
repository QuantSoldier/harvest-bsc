import { DeployFunction } from "hardhat-deploy/types";
import { FeeRewardForwarder, Storage } from "../typechain";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const storage = (await ethers.getContract("Storage", deployer)) as Storage;
  const forwarder = (await ethers.getContract(
    "FeeRewardForwarder",
    deployer
  )) as FeeRewardForwarder;

  const result = await deploy("Controller", {
    log: true,
    from: deployer,
    args: [storage.address, forwarder.address],
  });

  if (result.newlyDeployed) {
    await storage.setController(result.address).then((tx) => tx.wait());
  }
};

export default func;
func.tags = ["Controller"];
