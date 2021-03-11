import { DeployFunction } from "hardhat-deploy/types";

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
};

export default func;
func.tags = ["Strategy", "Mainnet", "Testnet"];
