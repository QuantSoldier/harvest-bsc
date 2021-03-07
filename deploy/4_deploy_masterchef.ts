import { DeployFunction } from "hardhat-deploy/types";
import { FeeRewardForwarder, Storage } from "../typechain";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer, wbnb } = await getNamedAccounts();
  const blockNum = ethers.provider.blockNumber;

  if (!network.live) {
    const cakeResult = await deploy("CakeToken", {
      from: deployer,
      log: true
    })

    const syrupResult = await deploy("SyrupBar", {
      from: deployer,
      log: true,
      args: [cakeResult.address]
    })

    const factoryResult = await deploy("PancakeFactory", {
      from: deployer,
      log: true,
      args: [deployer]
    })

    const routerResult = await deploy("PancakeRouter", {
      from: deployer,
      log: true,
      args: [factoryResult.address, wbnb]
    })

    const blockNumber = await ethers.provider.getBlockNumber();
    const chefResult = await deploy("MasterChef", {
      from: deployer,
      log: true,
      args: [
        cakeResult.address,
        syrupResult.address,
        deployer,
        ethers.utils.parseEther("40"),
        blockNumber
      ]
    })

    // mint some cake, give masterchef ownership
    // mint some syrup (?), give masterchef ownership
  }
};

export default func;
func.tags = ["MasterChef"];