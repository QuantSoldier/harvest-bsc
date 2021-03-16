// SPDX-License-Identifier: MIT

//SPDX-License-Identifier: Unlicense
pragma solidity 0.6.12;

import "./RewardTokenProfitNotifier.sol";
import "../hardworkInterface/IStrategyV2.sol";

abstract contract StrategyBase is IStrategyV2, RewardTokenProfitNotifier  {

  using SafeMath for uint256;
  using SafeBEP20 for IBEP20;

  event ProfitsNotCollected(address);
  event Liquidating(address, uint256);

  address public underlying;
  address public vault;
  mapping (address => bool) public override unsalvagableTokens;
  address public pancakeswapRouterV2;


  modifier restricted() {
    require(msg.sender == vault || msg.sender == address(controller()) || msg.sender == address(governance()),
      "The sender has to be the controller or vault or governance");
    _;
  }

  constructor(
    address _storage,
    address _underlying,
    address _vault,
    address _rewardToken,
    address _pancakeswap
  ) RewardTokenProfitNotifier(_storage, _rewardToken) public {
    underlying = _underlying;
    vault = _vault;
    unsalvagableTokens[_rewardToken] = true;
    unsalvagableTokens[_underlying] = true;
    pancakeswapRouterV2 = _pancakeswap;
  }

}
