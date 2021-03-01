import { expect } from "chai";
import { setupDeployTest } from "./setup";

describe("FeeRewardForwarder", () => {
  it("should deploy and setup correctly", async () => {
    const { deployer } = await setupDeployTest();
    const { Forwarder, Token } = deployer;

    const governance = await Forwarder.governance();
    const farm = await Forwarder.farm();

    expect(governance).eq(deployer.address);
    expect(farm).eq(Token.address);
  });
});
