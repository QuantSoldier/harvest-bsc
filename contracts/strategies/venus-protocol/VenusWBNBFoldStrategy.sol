// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
import "./VenusInteractor.sol";
import "../../lib/@harvest-finance/Controllable.sol";
import "../../lib/@harvest-finance/strategies/RewardTokenProfitNotifier.sol";
import "../../lib/@harvest-finance/hardworkInterface/IStrategyV2.sol";
import "../../lib/@harvest-finance/hardworkInterface/IVault.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract VenusFoldStrategy is RewardTokenProfitNotifier, VenusInteractor {

  using SafeMath for uint256;
  using SafeBEP20 for IBEP20;

  event ProfitNotClaimed();
  event TooLowBalance();

  /* IBEP20 public underlying; */
  bool public isWBNB = false;
  /* CompleteVToken public vtoken;
  ComptrollerInterface public comptroller; */

  address public vault;
  IBEP20 public xvs; // this will be Cream or Comp

  address public pancakeswapRouterV2;
  uint256 public suppliedInUnderlying;
  uint256 public borrowedInUnderlying;
  bool public liquidationAllowed = true;
  uint256 public sellFloor = 0;
  bool public allowEmergencyLiquidityShortage = false;
  uint256 public collateralFactorNumerator = 100;
  uint256 public collateralFactorDenominator = 1000;
  uint256 public folds = 0;

  uint256 public borrowMinThreshold = 0;

  // These tokens cannot be claimed by the controller
  mapping(address => bool) public unsalvagableTokens;

  modifier restricted() {
    require(msg.sender == vault || msg.sender == address(controller()) || msg.sender == address(governance()),
      "The sender has to be the controller or vault");
    _;
  }

  event Liquidated(
    uint256 amount
  );

  constructor(
    address _storage,
    address _underlying,
    address _vtoken,
    address _vault,
    address _comptroller,
    address _xvs,
    address _pancakeswap
  )
  RewardTokenProfitNotifier(_storage, _xvs)
  VenusInteractor(_underlying, _vtoken, _comptroller) public {
    require(IVault(_vault).underlying() == _underlying, "vault does not support underlying");
    comptroller = ComptrollerInterface(_comptroller);
    xvs = IBEP20(_xvs);
    underlying = IBEP20(_underlying);
    vtoken = CompleteVToken(_vtoken);
    vault = _vault;
    pancakeswapRouterV2 = _pancakeswap;

    // set these tokens to be not salvagable
    unsalvagableTokens[_underlying] = true;
    unsalvagableTokens[_vtoken] = true;
    unsalvagableTokens[_xvs] = true;
  }

  modifier updateSupplyInTheEnd() {
    _;
    suppliedInUnderlying = vtoken.balanceOfUnderlying(address(this));
    borrowedInUnderlying = vtoken.borrowBalanceCurrent(address(this));
  }

  function depositArbCheck() public view returns (bool) {
    // there's no arb here.
    return true;
  }

  /**
  * The strategy invests by supplying the underlying as a collateral.
  */
  function investAllUnderlying() public restricted updateSupplyInTheEnd {
    uint256 balance = underlying.balanceOf(address(this));
    _supplyBNBInWBNB(balance);
    for (uint256 i = 0; i < folds; i++) {
      uint256 borrowAmount = balance.mul(collateralFactorNumerator).div(collateralFactorDenominator);
      _borrowInWBNB(borrowAmount);
      balance = underlying.balanceOf(address(this));
      _supplyBNBInWBNB(balance);
    }
  }

  /**
  * Exits Compound and transfers everything to the vault.
  */
  function withdrawAllToVault() external restricted updateSupplyInTheEnd {
    if (allowEmergencyLiquidityShortage) {
      withdrawMaximum();
    } else {
      withdrawAllWeInvested();
    }
    if (underlying.balanceOf(address(this)) > 0) {
      IBEP20(address(underlying)).safeTransfer(vault, underlying.balanceOf(address(this)));
    }
  }

  function emergencyExit() external onlyGovernance updateSupplyInTheEnd {
    withdrawMaximum();
  }

  function withdrawMaximum() internal updateSupplyInTheEnd {
    if (liquidationAllowed) {
      claimVenus();
      liquidateVenus();
    } else {
      emit ProfitNotClaimed();
    }
    redeemMaximum();
  }

  function withdrawAllWeInvested() internal updateSupplyInTheEnd {
    if (liquidationAllowed) {
      claimVenus();
      liquidateVenus();
    } else {
      emit ProfitNotClaimed();
    }
    uint256 _currentSuppliedBalance = vtoken.balanceOfUnderlying(address(this));
    uint256 _currentBorrowedBalance = vtoken.borrowBalanceCurrent(address(this));

    mustRedeemPartial(_currentSuppliedBalance.sub(_currentBorrowedBalance));
  }

  function withdrawToVault(uint256 amountUnderlying) external restricted updateSupplyInTheEnd {
    if (amountUnderlying <= underlying.balanceOf(address(this))) {
      IBEP20(address(underlying)).safeTransfer(vault, amountUnderlying);
      return;
    }

    // get some of the underlying
    mustRedeemPartial(amountUnderlying);

    // transfer the amount requested (or the amount we have) back to vault
    IBEP20(address(underlying)).safeTransfer(vault, amountUnderlying);

    // invest back to compound
    investAllUnderlying();
  }

  /**
  * Withdraws all assets, liquidates COMP/CREAM, and invests again in the required ratio.
  */
  function doHardWork() public restricted {
    if (liquidationAllowed) {
      claimVenus();
      liquidateVenus();
    } else {
      emit ProfitNotClaimed();
    }
    investAllUnderlying();
  }

  /**
  * Redeems maximum that can be redeemed from Compound.
  * Redeem the minimum of the underlying we own, and the underlying that the cToken can
  * immediately retrieve. Ensures that `redeemMaximum` doesn't fail silently.
  *
  * DOES NOT ensure that the strategy cUnderlying balance becomes 0.
  */
  function redeemMaximum() internal {
    redeemMaximumWBNBWithLoan(
      collateralFactorNumerator,
      collateralFactorDenominator,
      borrowMinThreshold
    );
  }

  /**
  * Redeems `amountUnderlying` or fails.
  */
  function mustRedeemPartial(uint256 amountUnderlying) internal {
    require(
      vtoken.getCash() >= amountUnderlying,
      "market cash cannot cover liquidity"
    );
    redeemMaximum();
    require(underlying.balanceOf(address(this)) >= amountUnderlying, "Unable to withdraw the entire amountUnderlying");
  }

  /**
  * Salvages a token.
  */
  function salvage(address recipient, address token, uint256 amount) public onlyGovernance {
    // To make sure that governance cannot come in and take away the coins
    require(!unsalvagableTokens[token], "token is defined as not salvagable");
    IBEP20(token).safeTransfer(recipient, amount);
  }

  function liquidateVenus() internal {
    uint256 balance = xvs.balanceOf(address(this));
    if (balance < sellFloor || balance == 0) {
      emit TooLowBalance();
      return;
    }

    // give a profit share to fee forwarder, which re-distributes this to
    // the profit sharing pools
    notifyProfitInRewardToken(balance);

    balance = xvs.balanceOf(address(this));

    emit Liquidated(balance);
    // we can accept 1 as minimum as this will be called by trusted roles only
    uint256 amountOutMin = 1;
    IBEP20(address(xvs)).safeApprove(address(pancakeswapRouterV2), 0);
    IBEP20(address(xvs)).safeApprove(address(pancakeswapRouterV2), balance);
    address[] memory path = new address[](2);
    path[0] = address(xvs);
    path[1] = address(underlying);

    uint256 wBNBBefore = underlying.balanceOf(address(this));
    IUniswapV2Router02(pancakeswapRouterV2).swapExactTokensForTokens(
      balance,
      amountOutMin,
      path,
      address(this),
      block.timestamp
    );
  }

  /**
  * Returns the current balance. Ignores COMP/CREAM that was not liquidated and invested.
  */
  function investedUnderlyingBalance() public view returns (uint256) {
    // underlying in this strategy + underlying redeemable from Compound/Cream + loan
    return underlying.balanceOf(address(this))
    .add(suppliedInUnderlying)
    .sub(borrowedInUnderlying);
  }

  /**
  * Allows liquidation
  */
  function setLiquidationAllowed(bool allowed) external restricted {
    liquidationAllowed = allowed;
  }

  function setAllowLiquidityShortage(bool allowed) external restricted {
    allowEmergencyLiquidityShortage = allowed;
  }

  function setSellFloor(uint256 value) external restricted {
    sellFloor = value;
  }

  function setBorrowMinThreshold(uint256 threshold) public onlyGovernance {
    borrowMinThreshold = threshold;
  }

  // updating collateral factor
  // note 1: one should settle the loan first before calling this
  // note 2: collateralFactorDenominator is 1000, therefore, for 20%, you need 200
  function setCollateralFactorNumerator(uint256 numerator) public onlyGovernance {
    require(numerator <= 740, "Collateral factor cannot be this high");
    collateralFactorNumerator = numerator;
  }

  function setFolds(uint256 _folds) public onlyGovernance {
    folds = _folds;
  }
}
