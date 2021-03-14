import { getBEP20At, getVaultAt } from "./contracts";

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
