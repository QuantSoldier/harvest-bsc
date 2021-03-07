import { getNamedAccounts } from "hardhat";
import { getController, getForwarder, getMasterChefAt, getMasterChefStrategyAt, getStorage, getStrategyProxyAt, getToken, getVault, getVaultAt, getVaultProxyAt } from "./contracts";

export const setupAccounts = async () => {
  const { deployer } = await getNamedAccounts();

  return {
    deployer: await setupAccount(deployer),
  };
};

const setupAccount = async (signer: string) => {
  const Storage = await getStorage(signer);
  const Token = await getToken(signer);
  const Forwarder = await getForwarder(signer);
  const Controller = await getController(signer);

  return {
    address: signer,
    Storage,
    Token,
    Forwarder,
    Controller,
  };
};

export const setupCakeAccounts = async (
  cakeVault:string, 
  cakeVaultProxy:string,
  cakeStrategy:string,
  cakeStrategyProxy:string,
  cakeLpVault:string, 
  cakeLpVaultProxy:string,
  cakeLpStrategy:string,
  cakeLpStrategyProxy:string
) => {
  const { deployer } = await getNamedAccounts();

  return {
    deployer: await setupCakeAccount(
      deployer,
      cakeVault,
      cakeVaultProxy,
      cakeStrategy,
      cakeStrategyProxy,
      cakeLpVault,
      cakeLpVaultProxy,
      cakeLpStrategy,
      cakeLpStrategyProxy
    ),
  };
};

const setupCakeAccount = async (
  signer: string, 
  cakeVault:string, 
  cakeVaultProxy:string,
  cakeStrategy:string,
  cakeStrategyProxy:string,
  cakeLpVault:string, 
  cakeLpVaultProxy:string,
  cakeLpStrategy:string,
  cakeLpStrategyProxy:string
) => {
  const {chef} = await getNamedAccounts();
  const MasterChef = await getMasterChefAt(chef, signer);
  const CakeVault = await getVaultAt(cakeVault, signer);
  const CakeVaultProxy = await getVaultProxyAt(cakeVaultProxy, signer);
  const CakeStrategy = await getMasterChefStrategyAt(cakeStrategy, signer);
  const CakeStrategyProxy = await getStrategyProxyAt(cakeStrategyProxy, signer);
  const CakeLpVault = await getVaultAt(cakeLpVault, signer);
  const CakeLpVaultProxy = await getVaultProxyAt(cakeLpVaultProxy, signer);
  const CakeLpStrategy = await getMasterChefStrategyAt(cakeLpStrategy, signer);
  const CakeLpStrategyProxy = await getStrategyProxyAt(cakeLpStrategyProxy, signer) ;

  return {
    MasterChef,
    CakeVault,
    CakeVaultProxy,
    CakeStrategy,
    CakeStrategyProxy,
    CakeLpVault,
    CakeLpVaultProxy,
    CakeLpStrategy,
    CakeLpStrategyProxy
  }
};
