import { getNamedAccounts } from "hardhat";
import { getController, getForwarder, getStorage, getToken } from "./contracts";

export const setupAccounts = async () => {
  const { deployer } = await getNamedAccounts();

  return {
    deployer: await setupAccount(deployer),
  };
};

const setupAccount = async (address: string) => {
  const Storage = await getStorage(address);
  const Token = await getToken(address);
  const Forwarder = await getForwarder(address);
  const Controller = await getController(address);

  return {
    address,
    Storage,
    Token,
    Forwarder,
    Controller,
  };
};
