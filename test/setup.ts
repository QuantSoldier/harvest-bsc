import { BigNumber, BigNumberish } from "ethers";
import { deployments } from "hardhat";
import { setupAccounts } from "../utils/account";

import * as chai from "chai";
import { waffleChai } from "@ethereum-waffle/chai";
chai.use(waffleChai);

export const setupDeployTest = deployments.createFixture(async () => {
  await deployments.fixture(["Storage", "Token", "Forwarder", "Controller"]);
  const accounts = await setupAccounts();
  return accounts;
});
