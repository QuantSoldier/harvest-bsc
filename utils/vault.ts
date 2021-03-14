import {
  getBEP20At,
  getController,
  getControllerAt,
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

  await tokenContract.approve(vault, amount);
  await vaultContract.deposit(amount);
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
