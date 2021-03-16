import { getNamedAccounts, network } from "hardhat";
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
  getVenusVAIStrategy,
  getVenusVAIStrategyAt,
} from "./contracts";

export const impersonateAccounts = async (accounts: string[]) => {
  console.log("Impersonating");
  for (let account of accounts) {
    console.log(account);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [account],
    });
  }
};

export const setupAccounts = async () => {
  const { deployer, farmerAlpha } = await getNamedAccounts();

  return {
    deployer: await setupAccount(deployer),
    farmerAlpha: await setupAccount(farmerAlpha),
  };
};

export const setupStrategyAccounts = async (
  vault: string,
  strategy: string
) => {
  const accounts = await setupAccounts();

  const deployer = await setupStrategyAccount(
    accounts.deployer.address,
    vault,
    strategy
  );
  const farmerAlpha = await setupStrategyAccount(
    accounts.farmerAlpha.address,
    vault,
    strategy
  );

  return {
    ...accounts,
    deployer: {
      ...accounts.deployer,
      ...deployer,
    },
    farmerAlpha: {
      ...accounts.farmerAlpha,
      ...farmerAlpha,
    },
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
  const VenusVAIStrategy = await getVenusVAIStrategy(signer);

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
    VenusVAIStrategy,
  };
};

const setupStrategyAccount = async (
  signer: string,
  vault: string,
  strategy: string
) => {
  const Vault = await getVaultAt(vault, signer);
  const Strategy = await getMasterChefStrategyAt(strategy, signer);

  return {
    Vault,
    Strategy,
  };
};
