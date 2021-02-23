// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/BEP20.sol";

// Mock Reward Token - Testing Only
contract RewardToken is BEP20("FARM Reward Token", "bFARM") {

  function faucet(uint256 amount) external {
    _mint(msg.sender, amount);
  }
}
