import { ethers } from "hardhat";
import {
  Controller,
  FeeRewardForwarder,
  RewardToken,
  Storage,
} from "../typechain";

export const getStorage = async (address: string) => {
  const storage = (await ethers.getContract("Storage", address)) as Storage;
  return storage;
};

export const getToken = async (address: string) => {
  const token = (await ethers.getContract(
    "RewardToken",
    address
  )) as RewardToken;
  return token;
};

export const getForwarder = async (address: string) => {
  const forwarder = (await ethers.getContract(
    "FeeRewardForwarder",
    address
  )) as FeeRewardForwarder;
  return forwarder;
};

export const getController = async (address: string) => {
  const controller = (await ethers.getContract(
    "Controller",
    address
  )) as Controller;
  return controller;
};
