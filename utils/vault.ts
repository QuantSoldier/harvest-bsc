import {
  getBEP20At,
  getController,
  getControllerAt,
  getMasterChefStrategyAt,
  getVaultAt,
} from "./contracts";

export const depositVault = async (
  farmer: string,
  underlying: string,
  vault: string,
  amount: string
) => {
  const tokenContract = await getBEP20At(underlying, farmer);
  const vaultContract = await getVaultAt(vault, farmer);

  await tokenContract.approve(vault, amount).then((tx) => tx.wait());
  await vaultContract.deposit(amount).then((tx) => tx.wait());
};

export const addVaultAndStrategy = async (
  controller: string,
  signer: string,
  vault: string,
  strategy: string
) => {
  const controllerContract = await getControllerAt(controller, signer);

  await controllerContract
    .addVaultAndStrategy(vault, strategy)
    .then((tx) => tx.wait());
};

export const addPancakeSwapLiquidationRoute = async (
  masterChefStrategy: string,
  signer: string,
  token0Path: string[],
  token1Path: string[]
) => {
  const strategy = await getMasterChefStrategyAt(masterChefStrategy, signer);

  await strategy
    .setLiquidationPathsOnPancake(token0Path, token1Path)
    .then((tx) => tx.wait());
};
