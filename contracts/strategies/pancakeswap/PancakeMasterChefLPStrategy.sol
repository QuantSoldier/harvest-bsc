// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "./IMasterChef.sol";
import "../../lib/@harvest-finance/hardworkInterface/IStrategyV2.sol";
// import "@openzeppelin/contracts/math/Math.sol";
import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";
import "../../lib/@harvest-finance/hardworkInterface/IStrategy.sol";
import "../../lib/@harvest-finance/hardworkInterface/IVault.sol";
import "../../lib/@harvest-finance/strategies/upgradability/BaseUpgradeableStrategy.sol";
import "@pancakeswap-libs/pancake-swap-core/contracts/interfaces/IPancakePair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract PancakeMasterChefLPStrategy is IStrategyV2, BaseUpgradeableStrategy {
  using SafeMath for uint256;
  using SafeBEP20 for IBEP20;

  address public constant uniswapRouterV2 = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
  address public constant sushiswapRouterV2 = address(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

  // additional storage slots (on top of BaseUpgradeableStrategy ones) are defined here
  bytes32 internal constant _POOLID_SLOT = 0x3fd729bfa2e28b7806b03a6e014729f59477b530f995be4d51defc9dad94810b;
  bytes32 internal constant _USE_UNI_SLOT = 0x1132c1de5e5b6f1c4c7726265ddcf1f4ae2a9ecf258a0002de174248ecbf2c7a;

  // this would be reset on each upgrade
  mapping (address => address[]) public uniswapRoutes;
  mapping (address => address[]) public sushiswapRoutes;

  constructor() public BaseUpgradeableStrategy() {
    assert(_POOLID_SLOT == bytes32(uint256(keccak256("eip1967.strategyStorage.poolId")) - 1));
    assert(_USE_UNI_SLOT == bytes32(uint256(keccak256("eip1967.strategyStorage.useUni")) - 1));
  }

  function initializeStrategy(
    address _storage,
    address _underlying,
    address _vault,
    address _rewardPool,
    address _rewardToken,
    uint256 _poolID
  ) public initializer {

    BaseUpgradeableStrategy.initialize(
      _storage,
      _underlying,
      _vault,
      _rewardPool,
      _rewardToken,
      300, // profit sharing numerator
      1000, // profit sharing denominator
      true, // sell
      1e18, // sell floor
      12 hours // implementation change delay
    );

    address _lpt;
    (_lpt,,,) = IMasterChef(rewardPool()).poolInfo(_poolID);
    require(_lpt == underlying(), "Pool Info does not match underlying");
    _setPoolId(_poolID);

    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();

    // these would be required to be initialized separately by governance
    uniswapRoutes[uniLPComponentToken0] = new address[](0);
    uniswapRoutes[uniLPComponentToken1] = new address[](0);
    sushiswapRoutes[uniLPComponentToken0] = new address[](0);
    sushiswapRoutes[uniLPComponentToken1] = new address[](0);

    setBoolean(_USE_UNI_SLOT, true);
  }

  function depositArbCheck() public view override returns(bool) {
    return true;
  }

  function rewardPoolBalance() internal view returns (uint256 bal) {
      (bal,) = IMasterChef(rewardPool()).userInfo(poolId(), address(this));
  }

  function exitRewardPool() internal {
      uint256 bal = rewardPoolBalance();
      if (bal != 0) {
          IMasterChef(rewardPool()).withdraw(poolId(), bal);
      }
  }

  function unsalvagableTokens(address token) public view override returns (bool) {
    return (token == rewardToken() || token == underlying());
  }

  function enterRewardPool() internal {
    uint256 entireBalance = IBEP20(underlying()).balanceOf(address(this));
    IBEP20(underlying()).safeApprove(rewardPool(), 0);
    IBEP20(underlying()).safeApprove(rewardPool(), entireBalance);
    IMasterChef(rewardPool()).deposit(poolId(), entireBalance);
  }

  /*
  *   In case there are some issues discovered about the pool or underlying asset
  *   Governance can exit the pool properly
  *   The function is only used for emergency to exit the pool
  */
  function emergencyExit() public onlyGovernance {
    exitRewardPool();
    _setPausedInvesting(true);
  }

  /*
  *   Resumes the ability to invest into the underlying reward pools
  */

  function continueInvesting() public onlyGovernance {
    _setPausedInvesting(false);
  }

  function setLiquidationPathsOnUni(address [] memory _uniswapRouteToToken0, address [] memory _uniswapRouteToToken1) public onlyGovernance {
    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();
    uniswapRoutes[uniLPComponentToken0] = _uniswapRouteToToken0;
    uniswapRoutes[uniLPComponentToken1] = _uniswapRouteToToken1;
  }

  function setLiquidationPathsOnSushi(address [] memory _uniswapRouteToToken0, address [] memory _uniswapRouteToToken1) public onlyGovernance {
    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();
    sushiswapRoutes[uniLPComponentToken0] = _uniswapRouteToToken0;
    sushiswapRoutes[uniLPComponentToken1] = _uniswapRouteToToken1;
  }

  // We assume that all the tradings can be done on Uniswap
  function _liquidateReward() internal {
    uint256 rewardBalance = IBEP20(rewardToken()).balanceOf(address(this));
    if (!sell() || rewardBalance < sellFloor()) {
      // Profits can be disabled for possible simplified and rapid exit
      emit ProfitsNotCollected(sell(), rewardBalance < sellFloor());
      return;
    }

    notifyProfitInRewardToken(rewardBalance);
    uint256 remainingRewardBalance = IBEP20(rewardToken()).balanceOf(address(this));

    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();

    address[] memory routesToken0;
    address[] memory routesToken1;
    address routerV2;

    if(useUni()) {
      routerV2 = uniswapRouterV2;
      routesToken0 = uniswapRoutes[address(uniLPComponentToken0)];
      routesToken1 = uniswapRoutes[address(uniLPComponentToken1)];
    } else {
      routerV2 = sushiswapRouterV2;
      routesToken0 = sushiswapRoutes[address(uniLPComponentToken0)];
      routesToken1 = sushiswapRoutes[address(uniLPComponentToken1)];
    }


    if (remainingRewardBalance > 0 // we have tokens to swap
      && routesToken0.length > 1 // and we have a route to do the swap
      && routesToken1.length > 1 // and we have a route to do the swap
    ) {

      // allow Uniswap to sell our reward
      uint256 amountOutMin = 1;

      IBEP20(rewardToken()).safeApprove(routerV2, 0);
      IBEP20(rewardToken()).safeApprove(routerV2, remainingRewardBalance);

      uint256 toToken0 = remainingRewardBalance / 2;
      uint256 toToken1 = remainingRewardBalance.sub(toToken0);

      // we sell to uni

      // sell Uni to token1
      // we can accept 1 as minimum because this is called only by a trusted role
      IUniswapV2Router02(routerV2).swapExactTokensForTokens(
        toToken0,
        amountOutMin,
        routesToken0,
        address(this),
        block.timestamp
      );
      uint256 token0Amount = IBEP20(uniLPComponentToken0).balanceOf(address(this));

      // sell Uni to token2
      // we can accept 1 as minimum because this is called only by a trusted role
      IUniswapV2Router02(routerV2).swapExactTokensForTokens(
        toToken1,
        amountOutMin,
        routesToken1,
        address(this),
        block.timestamp
      );
      uint256 token1Amount = IBEP20(uniLPComponentToken1).balanceOf(address(this));

      // provide token1 and token2 to SUSHI
      IBEP20(uniLPComponentToken0).safeApprove(sushiswapRouterV2, 0);
      IBEP20(uniLPComponentToken0).safeApprove(sushiswapRouterV2, token0Amount);

      IBEP20(uniLPComponentToken1).safeApprove(sushiswapRouterV2, 0);
      IBEP20(uniLPComponentToken1).safeApprove(sushiswapRouterV2, token1Amount);

      // we provide liquidity to sushi
      uint256 liquidity;
      (,,liquidity) = IUniswapV2Router02(sushiswapRouterV2).addLiquidity(
        uniLPComponentToken0,
        uniLPComponentToken1,
        token0Amount,
        token1Amount,
        1,  // we are willing to take whatever the pair gives us
        1,  // we are willing to take whatever the pair gives us
        address(this),
        block.timestamp
      );
    }
  }

  /*
  *   Stakes everything the strategy holds into the reward pool
  */
  function investAllUnderlying() internal onlyNotPausedInvesting {
    // this check is needed, because most of the SNX reward pools will revert if
    // you try to stake(0).
    if(IBEP20(underlying()).balanceOf(address(this)) > 0) {
      enterRewardPool();
    }
  }

  /*
  *   Withdraws all the asset to the vault
  */
  function withdrawAllToVault() public override restricted {
    if (address(rewardPool()) != address(0)) {
      exitRewardPool();
    }
    _liquidateReward();
    IBEP20(underlying()).safeTransfer(vault(), IBEP20(underlying()).balanceOf(address(this)));
  }

  /*
  *   Withdraws all the asset to the vault
  */
  function withdrawToVault(uint256 amount) public restricted {
    // Typically there wouldn't be any amount here
    // however, it is possible because of the emergencyExit
    uint256 entireBalance = IBEP20(underlying()).balanceOf(address(this));

    if(amount > entireBalance){
      // While we have the check above, we still using SafeMath below
      // for the peace of mind (in case something gets changed in between)
      uint256 needToWithdraw = amount.sub(entireBalance);
      uint256 toWithdraw = SafeMath.min(rewardPoolBalance(), needToWithdraw);
      IMasterChef(rewardPool()).withdraw(poolId(), toWithdraw);
    }

    IBEP20(underlying()).safeTransfer(vault(), amount);
  }

  function withdrawToVault(uint256 correspondingShares, uint256 totalShares)  public override restricted {

  }

  /*
  *   Note that we currently do not have a mechanism here to include the
  *   amount of reward that is accrued.
  */
  function investedUnderlyingBalance() external view override returns (uint256) {
    if (rewardPool() == address(0)) {
      return IBEP20(underlying()).balanceOf(address(this));
    }
    // Adding the amount locked in the reward pool and the amount that is somehow in this contract
    // both are in the units of "underlying"
    // The second part is needed because there is the emergency exit mechanism
    // which would break the assumption that all the funds are always inside of the reward pool
    return rewardPoolBalance().add(IBEP20(underlying()).balanceOf(address(this)));
  }

  /*
  *   Governance or Controller can claim coins that are somehow transferred into the contract
  *   Note that they cannot come in take away coins that are used and defined in the strategy itself
  */
  function salvage(address recipient, address token, uint256 amount) external override onlyControllerOrGovernance {
     // To make sure that governance cannot come in and take away the coins
    require(!unsalvagableTokens(token), "token is defined as not salvagable");
    IBEP20(token).safeTransfer(recipient, amount);
  }

  /*
  *   Get the reward, sell it in exchange for underlying, invest what you got.
  *   It's not much, but it's honest work.
  *
  *   Note that although `onlyNotPausedInvesting` is not added here,
  *   calling `investAllUnderlying()` affectively blocks the usage of `doHardWork`
  *   when the investing is being paused by governance.
  */
  function doHardWork() external override onlyNotPausedInvesting restricted {
    exitRewardPool();
    _liquidateReward();
    investAllUnderlying();
  }

  /**
  * Can completely disable claiming UNI rewards and selling. Good for emergency withdraw in the
  * simplest possible way.
  */
  function setSell(bool s) public onlyGovernance {
    _setSell(s);
  }

  /**
  * Sets the minimum amount of CRV needed to trigger a sale.
  */
  function setSellFloor(uint256 floor) public onlyGovernance {
    _setSellFloor(floor);
  }

  // masterchef rewards pool ID
  function _setPoolId(uint256 _value) internal {
    setUint256(_POOLID_SLOT, _value);
  }

  function poolId() public view returns (uint256) {
    return getUint256(_POOLID_SLOT);
  }

  function setUseUni(bool _value) public onlyGovernance {
    setBoolean(_USE_UNI_SLOT, _value);
  }

  function useUni() public view returns (bool) {
    return getBoolean(_USE_UNI_SLOT);
  }

  function finalizeUpgrade() external onlyGovernance {
    _finalizeUpgrade();
    // reset the liquidation paths
    // they need to be re-set manually
    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();

    // these would be required to be initialized separately by governance
    uniswapRoutes[uniLPComponentToken0] = new address[](0);
    uniswapRoutes[uniLPComponentToken1] = new address[](0);
    sushiswapRoutes[uniLPComponentToken0] = new address[](0);
    sushiswapRoutes[uniLPComponentToken1] = new address[](0);
  }
}