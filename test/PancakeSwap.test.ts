import { expect } from "chai"
import { parseEther } from "ethers/lib/utils"
import { ethers, getNamedAccounts } from "hardhat"
import { setupCakeAccounts } from "../utils/account"
import { setupCakeTest } from "./setup"

describe('PancakeMasterChefLp', () => {
  it('deploys the Vaults correctly', async () => {
    const {cake, cakeLp} = await getNamedAccounts()
    const { deployer } = await setupCakeTest()
    const {CakeVault, CakeLpVault} = deployer

    const cakeGovernance = await CakeVault.governance();
    const cakeSymbol = await CakeVault.symbol();
    const cakeUnderlying = await CakeVault.underlying();
    const cakeUnderlyingUnit = await CakeVault.underlyingUnit();

    const cakeLpGovernance = await CakeLpVault.governance();
    const cakeLpSymbol = await CakeLpVault.symbol();
    const cakeLpUnderlying = await CakeLpVault.underlying();
    const cakeLpUnderlyingUnit = await CakeLpVault.underlyingUnit();

    expect(cakeGovernance).eq(deployer.address)
    expect(cakeSymbol).eq("bfCake")
    expect(cakeUnderlying).eq(cake)
    expect(cakeUnderlyingUnit.toString()).eq(parseEther('1').toString())

    // expect(cakeLpGovernance).eq(deployer.address)
    // expect(cakeLpSymbol).eq("bfCake-LP")
    // expect(cakeLpUnderlying).eq(cakeLp)
    // expect(cakeLpUnderlyingUnit.toString()).eq(parseEther('1').toString())
  }) 

  it('deploys the Strategies correctly', async () => {
    const {cake, cakeLp, router} = await getNamedAccounts()
    const { deployer } = await setupCakeTest()
    const {CakeStrategy, CakeVault, CakeLpStrategy} = deployer

    const cakeRouter = await CakeStrategy.pancakeswapRouterV2();
    
    const cakeGovernance = await CakeStrategy.governance();
    const cakeController = await CakeStrategy.controller();
    const cakeId = await CakeStrategy.poolId();
    const cakeUnderlying = await CakeStrategy.underlying();
    const cakeVault = await CakeStrategy.vault();
    const cakeRewardToken = await CakeStrategy.rewardToken();

    expect(cakeRouter).eq(router);
    expect(cakeGovernance).eq(deployer.address);
    expect(cakeController).eq(deployer.Controller.address);
    expect(cakeId).eq(0);
    expect(cakeUnderlying).eq(cake);
    expect(cakeVault).eq(deployer.CakeVaultProxy.address);
    expect(cakeRewardToken).eq(cake);
  })

  // it('allows deposits into the Vaults', async () => {

  // })
})