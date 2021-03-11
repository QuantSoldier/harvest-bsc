import { getNamedAccounts } from "hardhat";
import {
  getController,
  getForwarder,
  getMasterChefAt,
  getMasterChefStrategy,
  getMasterChefStrategyAt,
  getStorage,
  getStrategyProxyAt,
  getToken,
  getVault,
  getVaultAt,
  getVaultProxyAt,
  getVenusFoldStrategy,
  getVenusFoldStrategyAt,
  getVenusWBNBFoldStrategy,
  getVenusWBNBFoldStrategyAt,
} from "./contracts";

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
  const Vault = await getVault(signer);
  const MasterChefStrategy = await getMasterChefStrategy(signer);
  const VenusFoldStrategy = await getVenusFoldStrategy(signer);
  const VenusWBNBFoldStrategy = await getVenusWBNBFoldStrategy(signer);

  return {
    address: signer,
    Storage,
    Token,
    Forwarder,
    Controller,
    Vault,
    MasterChefStrategy,
    VenusFoldStrategy,
    VenusWBNBFoldStrategy,
  };
};
