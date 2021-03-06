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

  // Use Proxy deployment to upgrade
  const result = await deploy("VenusWBNBFoldStrategy", {
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
