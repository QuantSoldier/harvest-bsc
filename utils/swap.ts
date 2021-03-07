import { getBEP20At, getRouterAt } from "./contracts"


export const addLiquidityBNB = async (
  router:string,
  signer:string,
  token:string, 
  amount:string, 
  value:string
) => {
  const pancakeRouter = await getRouterAt(router, signer);
  const tokenContract = await getBEP20At(token, signer);

  await tokenContract.approve(router, amount).then(tx => tx.wait())
  await pancakeRouter.addLiquidityETH(
    token,
    amount,
    0,
    0,
    signer,
    Date.now() + 900000,
    { value }
  ).then(tx => tx.wait())
}