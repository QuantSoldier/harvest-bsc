import { DeployFunction } from "hardhat-deploy/types";
import { Storage, RewardToken } from "../typechain";
import { run } from "hardhat";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer, token } = await getNamedAccounts();
  const storage = (await ethers.getContract("Storage", deployer)) as Storage;

  let tokenAddress: string;
  if (!network.live) {
    const token = (await ethers.getContract(
      "RewardToken",
      deployer
    )) as RewardToken;
    tokenAddress = token.address;
  } else {
    tokenAddress = token;
  }

  const result = await deploy("FeeRewardForwarder", {
    log: true,
    from: deployer,
    args: [storage.address, tokenAddress],
  });

  if (result.newlyDeployed) {
    await run("verify:verify", {
      address: result.address,
      constructorArguments: [storage.address, tokenAddress],
    })
  }
};

export default func;
func.tags = ["Forwarder"];
