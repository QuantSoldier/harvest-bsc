// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "./IMasterChef.sol";
import "../../lib/@harvest-finance/hardworkInterface/IStrategyV2.sol";
import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
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

  address constant public pancakeswapRouterV2 = address(0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F);

  // additional storage slots (on top of BaseUpgradeableStrategy ones) are defined here
  bytes32 internal constant _POOLID_SLOT = 0x3fd729bfa2e28b7806b03a6e014729f59477b530f995be4d51defc9dad94810b;

  // boolean to determine if underlying is single asset or LP token
  bool public isLpToken;

  // this would be reset on each upgrade
  mapping (address => address[]) public pancakeswapRoutes;

  constructor() public BaseUpgradeableStrategy() {
    assert(_POOLID_SLOT == bytes32(uint256(keccak256("eip1967.strategyStorage.poolId")) - 1));
  }

  function initializeStrategy(
    address _storage,
    address _underlying,
    address _vault,
    address _rewardPool,
    address _rewardToken,
    uint256 _poolID,
    bool _isLpToken
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
    _setIsLpToken(_isLpToken);

    if (isLpToken) {
      address uniLPComponentToken0 = IPancakePair(underlying()).token0();
      address uniLPComponentToken1 = IPancakePair(underlying()).token1();

      // these would be required to be initialized separately by governance
      pancakeswapRoutes[uniLPComponentToken0] = new address[](0);
      pancakeswapRoutes[uniLPComponentToken1] = new address[](0);
    } else {
      pancakeswapRoutes[underlying()] = new address[](0);
    }
  }

  function depositArbCheck() public view override returns(bool) {
    return true;
  }

  function rewardPoolBalance() internal view returns (uint256 bal) {
      (bal,) = IMasterChef(rewardPool()).userInfo(poolId(), address(this));
  }

  function exitRewardPool(uint256 bal) internal {
    if (poolId() == 0) {
      IMasterChef(rewardPool()).leaveStaking(bal);
    } else {
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

    if (poolId() == 0) {
      IMasterChef(rewardPool()).enterStaking(entireBalance);
    } else {
      IMasterChef(rewardPool()).deposit(poolId(), entireBalance);
    }
  }

  /*
  *   In case there are some issues discovered about the pool or underlying asset
  *   Governance can exit the pool properly
  *   The function is only used for emergency to exit the pool
  */
  function emergencyExit() public onlyGovernance {
    uint256 bal = rewardPoolBalance();
    exitRewardPool(bal);
    _setPausedInvesting(true);
  }

  /*
  *   Resumes the ability to invest into the underlying reward pools
  */

  function continueInvesting() public onlyGovernance {
    _setPausedInvesting(false);
  }

  function setLiquidationPathsOnPancake(address [] memory _uniswapRouteToToken0, address [] memory _uniswapRouteToToken1) public onlyGovernance {
    if (isLpToken) {
      address uniLPComponentToken0 = IPancakePair(underlying()).token0();
      address uniLPComponentToken1 = IPancakePair(underlying()).token1();
      pancakeswapRoutes[uniLPComponentToken0] = _uniswapRouteToToken0;
      pancakeswapRoutes[uniLPComponentToken1] = _uniswapRouteToToken1;
    } else {
      pancakeswapRoutes[underlying()] = _uniswapRouteToToken0;
    }
  }

  function _claimReward() internal {
    if (poolId() == 0) {
      IMasterChef(rewardPool()).leaveStaking(0); // withdraw 0 so that we dont notify fees on basis
    } else {
      IMasterChef(rewardPool()).withdraw(poolId(), 0);
    }
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

    if (remainingRewardBalance > 0) {
      if (isLpToken) {
        _liquidateLpAssets(remainingRewardBalance);
      } else {
        _liquidateSingleAsset(remainingRewardBalance);
      }
    }
  }

  // Liquidate Cake into the single underlying asset (non-LP tokens), no-op if Cake is the underlying
  function _liquidateSingleAsset(uint256 remainingRewardBalance) internal {
    if (poolId() != 0) {
      address[] memory routesToken0 = pancakeswapRoutes[underlying()];

      uint256 amountOutMin = 1;

      // allow PancakeSwap to sell our reward
      IBEP20(rewardToken()).safeApprove(pancakeswapRouterV2, 0);
      IBEP20(rewardToken()).safeApprove(pancakeswapRouterV2, remainingRewardBalance);

      // sell Uni to token2
      // we can accept 1 as minimum because this is called only by a trusted role
      IUniswapV2Router02(pancakeswapRouterV2).swapExactTokensForTokens(
        remainingRewardBalance,
        amountOutMin,
        routesToken0,
        address(this),
        block.timestamp
      );
    }
  }

  // Liquidate Cake into underlying LP tokens, only do one swap if Cake/WBNB LP is the underlying
  function _liquidateLpAssets(uint256 remainingRewardBalance) internal {
    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();

    address[] memory routesToken0 = pancakeswapRoutes[address(uniLPComponentToken0)];
    address[] memory routesToken1 = pancakeswapRoutes[address(uniLPComponentToken1)];

    uint256 amountOutMin = 1;

    // allow PancakeSwap to sell our reward
    IBEP20(rewardToken()).safeApprove(pancakeswapRouterV2, 0);
    IBEP20(rewardToken()).safeApprove(pancakeswapRouterV2, remainingRewardBalance);

    uint256 token0Amount;
    uint256 token1Amount;

    if (
      uniLPComponentToken0 == rewardToken()  // we are dealing with CAKE/WBNB LP
      && routesToken1.length > 1 // we have a route to do the swap
    ) {
      token0Amount = remainingRewardBalance / 2; // 1/2 of CAKE is saved for LP
      uint256 toToken1 = remainingRewardBalance.sub(token0Amount); // other 1/2 is liquidated

      // sell Cake to token1
      // we can accept 1 as minimum because this is called only by a trusted role
      IUniswapV2Router02(pancakeswapRouterV2).swapExactTokensForTokens(
        toToken1,
        amountOutMin,
        routesToken1,
        address(this),
        block.timestamp
      );
      token1Amount = IBEP20(uniLPComponentToken1).balanceOf(address(this));

      // Only approve WBNB, CAKE has already been approved at this point
      IBEP20(uniLPComponentToken1).safeApprove(pancakeswapRouterV2, 0);
      IBEP20(uniLPComponentToken1).safeApprove(pancakeswapRouterV2, token1Amount);

      // we provide liquidity to PancakeSwap
      uint256 liquidity;
      (,,liquidity) = IUniswapV2Router02(pancakeswapRouterV2).addLiquidity(
        uniLPComponentToken0,
        uniLPComponentToken1,
        token0Amount,
        token1Amount,
        1,  // we are willing to take whatever the pair gives us
        1,  // we are willing to take whatever the pair gives us
        address(this),
        block.timestamp
      );
    } else if (
      routesToken0.length > 1 // and we have a route to do the swap
      && routesToken1.length > 1 // and we have a route to do the swap
    ) {
      uint256 toToken0 = remainingRewardBalance / 2;
      uint256 toToken1 = remainingRewardBalance.sub(toToken0);

      // sell Cake to token0
      // we can accept 1 as minimum because this is called only by a trusted role
      IUniswapV2Router02(pancakeswapRouterV2).swapExactTokensForTokens(
        toToken0,
        amountOutMin,
        routesToken0,
        address(this),
        block.timestamp
      );
      token0Amount = IBEP20(uniLPComponentToken0).balanceOf(address(this));

      // sell Cake to token1
      // we can accept 1 as minimum because this is called only by a trusted role
      IUniswapV2Router02(pancakeswapRouterV2).swapExactTokensForTokens(
        toToken1,
        amountOutMin,
        routesToken1,
        address(this),
        block.timestamp
      );
      token1Amount = IBEP20(uniLPComponentToken1).balanceOf(address(this));

      // provide token1 and token2 to SUSHI
      IBEP20(uniLPComponentToken0).safeApprove(pancakeswapRouterV2, 0);
      IBEP20(uniLPComponentToken0).safeApprove(pancakeswapRouterV2, token0Amount);

      IBEP20(uniLPComponentToken1).safeApprove(pancakeswapRouterV2, 0);
      IBEP20(uniLPComponentToken1).safeApprove(pancakeswapRouterV2, token1Amount);

      // we provide liquidity to PancakeSwap
      uint256 liquidity;
      (,,liquidity) = IUniswapV2Router02(pancakeswapRouterV2).addLiquidity(
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
      uint256 bal = rewardPoolBalance();
      exitRewardPool(bal);
    }
    if (poolId()!=0) {
      _liquidateReward();
    }
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
    uint256 bal = rewardPoolBalance();
    if (bal != 0) {
      _claimReward();
      _liquidateReward();
    }

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

  function _setIsLpToken(bool _isLpToken) internal {
    isLpToken = _isLpToken;
  }

  // masterchef rewards pool ID
  function _setPoolId(uint256 _value) internal {
    setUint256(_POOLID_SLOT, _value);
  }

  function poolId() public view returns (uint256) {
    return getUint256(_POOLID_SLOT);
  }

  function finalizeUpgrade() external onlyGovernance {
    _finalizeUpgrade();
    // reset the liquidation paths
    // they need to be re-set manually
    address uniLPComponentToken0 = IPancakePair(underlying()).token0();
    address uniLPComponentToken1 = IPancakePair(underlying()).token1();

    // these would be required to be initialized separately by governance
    pancakeswapRoutes[uniLPComponentToken0] = new address[](0);
    pancakeswapRoutes[uniLPComponentToken1] = new address[](0);
  }
}
