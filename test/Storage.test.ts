import { expect } from "chai";
import { setupDeployTest } from "./setup";

describe("Storage", () => {
  it("should deploy and setup correctly", async () => {
    const { deployer } = await setupDeployTest();
    const { Storage, Controller } = deployer;

    const controllerAddress = await Storage.controller();
    const governanceAddress = await Storage.governance();

    expect(controllerAddress).eq(Controller.address);
    expect(governanceAddress).eq(deployer.address);
  });

  it("should have correct views", async () => {
    const { deployer } = await setupDeployTest();
    const { Storage, Controller } = deployer;

    const isController = await Storage.isController(Controller.address);
    const isGovernance = await Storage.isGovernance(deployer.address);

    expect(isController).eq(true);
    expect(isGovernance).eq(true);
  });

  it("should set controller", async () => {
    const { deployer } = await setupDeployTest();
    const { Storage, Controller } = deployer;

    // const controllerAddress = await Storage.controller();
    // const governanceAddress = await Storage.governance();

    // expect(controllerAddress).eq(Controller.address);
    // expect(governanceAddress).eq(address);
  });

  it("should set governance", async () => {
    const { deployer } = await setupDeployTest();
    const { Storage, Controller } = deployer;

    // const controllerAddress = await Storage.controller();
    // const governanceAddress = await Storage.governance();

    // expect(controllerAddress).eq(Controller.address);
    // expect(governanceAddress).eq(address);
  });
});
