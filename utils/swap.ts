import { getNamedAccounts } from "hardhat";
import { getBEP20At, getFactoryAt, getRouterAt, getWBNBAt } from "./contracts";

export const addLiquidityBNB = async (
  signer: string,
  token: string,
  amount: string,
  value: string
) => {
  const { router, factory, wbnb } = await getNamedAccounts();
  const pancakeRouter = await getRouterAt(router, signer);
  const tokenContract = await getBEP20At(token, signer);
  const factoryContract = await getFactoryAt(factory, signer);

  const lpToken = await factoryContract.getPair(wbnb, token);
  const lpTokenContract = await getBEP20At(lpToken, signer);

  await tokenContract.approve(router, amount).then((tx) => tx.wait());

  const balance = await lpTokenContract.balanceOf(signer);
  await pancakeRouter
    .addLiquidityETH(token, amount, 0, 0, signer, Date.now() + 900000, {
      value,
    })
    .then((tx) => tx.wait());
  const balanceAfter = await lpTokenContract.balanceOf(signer);

  return balanceAfter.sub(balance);
};

export const buyTokensWithBNB = async (
  signer: string,
  token: string,
  value: string
) => {
  const { router, wbnb } = await getNamedAccounts();
  const pancakeRouter = await getRouterAt(router, signer);
  const tokenContract = await getBEP20At(token, signer);
  const path = [wbnb, token];

  const balance = await tokenContract.balanceOf(signer);
  await pancakeRouter
    .swapExactETHForTokens(0, path, signer, Date.now() + 900000, { value })
    .then((tx) => tx.wait());
  const balanceAfter = await tokenContract.balanceOf(signer);

  return balanceAfter.sub(balance);
};

export const wrapBNB = async (
  signer: string,
  value: string
) => {
  const { wbnb } = await getNamedAccounts();
  const contract = await getWBNBAt(wbnb, signer);
  const token = await getBEP20At(wbnb, signer);

  const balance = await token.balanceOf(signer);
  await contract.deposit({value});
  const balanceAfter = await token.balanceOf(signer);

  return balanceAfter.sub(balance);
}
