import { expect } from "chai";
import { setupDeployTest } from "./setup";

describe("Controller", () => {
  it("should deploy and setup correctly", async () => {
    const { deployer } = await setupDeployTest();
    const { Controller, Forwarder, Storage } = deployer;

    const forwarder = await Controller.feeRewardForwarder();
    const store = await Controller.store();

    expect(forwarder).eq(Forwarder.address);
    expect(store).eq(Storage.address);
  });
});
