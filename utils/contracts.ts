import { ethers } from "hardhat";
import {
  BaseUpgradeableStrategy,
  Controller,
  FeeRewardForwarder,
  RewardToken,
  Storage,
  Vault,
} from "../typechain";

export const getStorage = async (signer: string) => {
  const storage = (await ethers.getContract("Storage", signer)) as Storage;
  return storage;
};

export const getStorageAt = async (address: string, signer: string) => {
  const storage = (await ethers.getContractAt("Storage", address, signer)) as Storage;
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

export const getVault = async (signer: string) => {
  const vault = (await ethers.getContract(
    "Vault",
    signer
  )) as Vault;
  return vault;
};

export const getVaultAt = async (address:string, signer: string) => {
  const vault = (await ethers.getContractAt(
    "Vault",
    address,
    signer
  )) as Vault;
  return vault;
};

export const getStrategy = async (signer:string) => {

}

export const getStrategyAt = async (address:string, signer:string) => {
  const strategy = await ethers.getContractAt('BaseUpgradeableStrategy', address, signer) as BaseUpgradeableStrategy;

  return strategy;
}
