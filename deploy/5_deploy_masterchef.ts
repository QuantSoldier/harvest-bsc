import { DeployFunction } from "hardhat-deploy/types";
import { FeeRewardForwarder, Storage } from "../typechain";

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
};

export default func;
func.tags = ["Vault", "Mainnet", "Testnet"];
