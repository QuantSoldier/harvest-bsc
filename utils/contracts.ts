import { ethers } from "hardhat";
import {
  BaseUpgradeableStrategy,
  BEP20,
  Controller,
  FeeRewardForwarder,
  IMasterChef,
  PancakeFactory,
  PancakeMasterChefLPStrategy,
  PancakeRouter,
  RewardToken,
  Storage,
  StrategyProxy,
  Vault,
  VaultProxy,
  VenusFoldStrategy,
  VenusVAIStrategy,
  VenusWBNBFoldStrategy,
  WBNB,
  IVAIVault,
} from "../typechain";

export const getStorage = async (signer: string) => {
  const storage = (await ethers.getContract("Storage", signer)) as Storage;
  return storage;
};

export const getStorageAt = async (address: string, signer: string) => {
  const storage = (await ethers.getContractAt(
    "Storage",
    address,
    signer
  )) as Storage;
  return storage;
};

export const getToken = async (signer: string) => {
  const token = (await ethers.getContract(
    "RewardToken",
    signer
  )) as RewardToken;
  return token;
};

export const getForwarder = async (signer: string) => {
  const forwarder = (await ethers.getContract(
    "FeeRewardForwarder",
    signer
  )) as FeeRewardForwarder;
  return forwarder;
};

export const getController = async (signer: string) => {
  const controller = (await ethers.getContract(
    "Controller",
    signer
  )) as Controller;
  return controller;
};

export const getControllerAt = async (address: string, signer: string) => {
  const controller = (await ethers.getContractAt(
    "Controller",
    address,
    signer
  )) as Controller;
  return controller;
};

export const getVault = async (signer: string) => {
  const vault = (await ethers.getContract("Vault", signer)) as Vault;
  return vault;
};

export const getVaultAt = async (address: string, signer: string) => {
  const vault = (await ethers.getContractAt("Vault", address, signer)) as Vault;
  return vault;
};

export const getVaultProxyAt = async (address: string, signer: string) => {
  const vaultProxy = (await ethers.getContractAt(
    "VaultProxy",
    address,
    signer
  )) as VaultProxy;
  return vaultProxy;
};

export const getStrategyAt = async (address: string, signer: string) => {
  const strategy = (await ethers.getContractAt(
    "BaseUpgradeableStrategy",
    address,
    signer
  )) as BaseUpgradeableStrategy;
  return strategy;
};

export const getStrategyProxyAt = async (address: string, signer: string) => {
  const strategyProxy = (await ethers.getContractAt(
    "StrategyProxy",
    address,
    signer
  )) as StrategyProxy;
  return strategyProxy;
};

export const getMasterChefStrategy = async (signer: string) => {
  const strategy = (await ethers.getContract(
    "PancakeMasterChefLPStrategy",
    signer
  )) as PancakeMasterChefLPStrategy;
  return strategy;
};

export const getMasterChefStrategyAt = async (
  address: string,
  signer: string
) => {
  const strategy = (await ethers.getContractAt(
    "PancakeMasterChefLPStrategy",
    address,
    signer
  )) as PancakeMasterChefLPStrategy;
  return strategy;
};

export const getMasterChefAt = async (address: string, signer: string) => {
  const chef = (await ethers.getContractAt(
    "MasterChef",
    address,
    signer
  )) as IMasterChef;
  return chef;
};

export const getRouterAt = async (address: string, signer: string) => {
  const router = (await ethers.getContractAt(
    "PancakeRouter",
    address,
    signer
  )) as PancakeRouter;
  return router;
};

export const getFactoryAt = async (address: string, signer: string) => {
  const factory = (await ethers.getContractAt(
    "PancakeFactory",
    address,
    signer
  )) as PancakeFactory;
  return factory;
};

export const getBEP20At = async (address: string, signer: string) => {
  const token = (await ethers.getContractAt("BEP20", address, signer)) as BEP20;
  return token;
};

export const getVenusFoldStrategy = async (signer: string) => {
  const strategy = (await ethers.getContract(
    "VenusFoldStrategy",
    signer
  )) as VenusFoldStrategy;
  return strategy;
};

export const getVenusFoldStrategyAt = async (
  address: string,
  signer: string
) => {
  const strategy = (await ethers.getContractAt(
    "VenusFoldStrategy",
    address,
    signer
  )) as VenusFoldStrategy;
  return strategy;
};

export const getVenusWBNBFoldStrategy = async (signer: string) => {
  const strategy = (await ethers.getContract(
    "VenusWBNBFoldStrategy",
    signer
  )) as VenusWBNBFoldStrategy;
  return strategy;
};

export const getVenusWBNBFoldStrategyAt = async (
  address: string,
  signer: string
) => {
  const strategy = (await ethers.getContractAt(
    "VenusWBNBFoldStrategy",
    address,
    signer
  )) as VenusWBNBFoldStrategy;
  return strategy;
};

export const getWBNBAt = async (
  address: string,
  signer: string
) => {
  const wbnb = (await ethers.getContractAt(
    "WBNB",
    address,
    signer
  )) as WBNB;
  return wbnb;
};

export const getVenusVAIStrategy = async (signer: string) => {
  const strategy = (await ethers.getContract(
    "VenusVAIStrategy",
    signer
  )) as VenusVAIStrategy;
  return strategy;
};

export const getVenusVAIStrategyAt = async (
  address: string,
  signer: string
) => {
  const strategy = (await ethers.getContractAt(
    "VenusVAIStrategy",
    address,
    signer
  )) as VenusVAIStrategy;
  return strategy;
};

export const getVAIVaultAt = async (
  address: string,
  signer: string
) => {
  const vaivault = (await ethers.getContractAt(
    "IVAIVault",
    address,
    signer
  )) as IVAIVault;
  return vaivault;
};
