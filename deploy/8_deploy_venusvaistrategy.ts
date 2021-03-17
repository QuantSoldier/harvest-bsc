import { DeployFunction } from "hardhat-deploy/types";
import { Vault, Storage } from "../typechain";
import { run } from "hardhat";

//Please note that this script does not provide the correct vault.
//It is needed to allow deployment in tests. For actual deployment a proper
//vault needs to be supplied.


const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  network,
  ethers,
}) => {
  const { deploy } = deployments;
  const { deployer, vai, venus, router, vvaiVault } = await getNamedAccounts();

  const storage = (await ethers.getContract("Storage", deployer)) as Storage;
  const vault = (await ethers.getContract("Vault", deployer)) as Vault;


  // Use Proxy deployment to upgrade
  const result = await deploy("VenusVAIStrategy", {
    log: true,
    from: deployer,
    args: [storage.address, vai, vault.address, venus, router, vvaiVault],
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
