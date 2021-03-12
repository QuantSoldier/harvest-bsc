import { DeployFunction } from "hardhat-deploy/types";
import { FeeRewardForwarder, Storage } from "../typechain";
import { run } from "hardhat";

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
    await run("verify:verify", {
      address: result.address,
      constructorArguments: [storage.address, forwarder.address],
    })
  }
};

export default func;
func.tags = ["Controller"];
