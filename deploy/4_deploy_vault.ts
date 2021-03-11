import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy("Vault", {
    log: true,
    from: deployer,
  });
};

export default func;
func.tags = ["Vault", "Mainnet", "Testnet"];
