// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";

/*
*   Changes made to the SynthetixReward contract
*
*   uni to lpToken, and make it as a parameter of the constructor instead of hardcoded.
*
*
*/

contract LPTokenWrapper {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    IBEP20 public lpToken;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        lpToken.safeTransfer(msg.sender, amount);
    }

    // Harvest migrate
    // only called by the migrateStakeFor in the MigrationHelperRewardPool
    function migrateStakeFor(address target, uint256 amountNewShare) internal virtual {
      _totalSupply = _totalSupply.add(amountNewShare);
      _balances[target] = _balances[target].add(amountNewShare);
    }
}