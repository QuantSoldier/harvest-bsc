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
  const { deployer, cake, chef } = await getNamedAccounts();

  // Use Proxy deployment to upgrade
  const result = await deploy("PancakeMasterChefLPStrategy", {
    log: true,
    from: deployer,
  });

  if (result.newlyDeployed) {
    if (network.live) {
      await run("verify:verify", {
        address: result.address,
      })
    }
  }
};

export default func;
func.tags = ["Strategy", "Mainnet", "Testnet", "Setup"];
