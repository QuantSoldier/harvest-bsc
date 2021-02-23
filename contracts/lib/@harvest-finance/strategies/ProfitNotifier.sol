// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";
import "../hardworkInterface/IController.sol";
import "../Controllable.sol";

contract ProfitNotifier is Controllable {
  using SafeMath for uint256;
  using SafeBEP20 for IBEP20;

  uint256 public profitSharingNumerator;
  uint256 public profitSharingDenominator;
  address public underlying;

  event ProfitLog(
    uint256 oldBalance,
    uint256 newBalance,
    uint256 feeAmount,
    uint256 timestamp
  );

  constructor(
    address _storage,
    address _underlying
  ) public Controllable(_storage){
    underlying = _underlying;
    // persist in the state for immutability of the fee
    profitSharingNumerator = 30; //IController(controller()).profitSharingNumerator();
    profitSharingDenominator = 100; //IController(controller()).profitSharingDenominator();
    require(profitSharingNumerator < profitSharingDenominator, "invalid profit share");
  }

  function notifyProfit(uint256 oldBalance, uint256 newBalance) internal {
    if (newBalance > oldBalance) {
      uint256 profit = newBalance.sub(oldBalance);
      uint256 feeAmount = profit.mul(profitSharingNumerator).div(profitSharingDenominator);
      emit ProfitLog(oldBalance, newBalance, feeAmount, block.timestamp);

      IBEP20(underlying).safeApprove(controller(), 0);
      IBEP20(underlying).safeApprove(controller(), feeAmount);
      IController(controller()).notifyFee(
        underlying,
        feeAmount
      );
    } else {
      emit ProfitLog(oldBalance, newBalance, 0, block.timestamp);
    }
  }
}
