pragma solidity ^0.6.0;

import {Address} from "@pancakeswap/pancake-swap-lib/contracts/utils/Address.sol";
import {SafeMath} from "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
import {IBEP20} from "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
import {SafeBEP20} from "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";
import {IStrategy} from "../hardworkInterface/IStrategy.sol";
import { Controllable } from "../Controllable.sol";
import {IMigrator} from "../hardworkInterface/IMigrator.sol";
import {IVault} from "../hardworkInterface/IVault.sol";


contract VaultMigratorStrategy is IStrategy, Controllable {
  using SafeBEP20 for IBEP20;
  using Address for address;
  using SafeMath for uint256;

  address public override underlying;
  address public override vault;
  address public newVault;
  address public migrator;
  mapping(address => bool) public override unsalvagableTokens;

  constructor(
    address _storage,
    address _underlying,
    address _vault,
    address _newVault
  ) 
    public
    Controllable(_storage)
  {
    require(_underlying != address(0), "_underlying cannot be empty");
    require(_vault != address(0), "_vault cannot be empty");
    require(_newVault != address(0), "_newVault cannot be empty");

    require(IVault(_newVault).underlying() == _underlying, "underlying must match");

    unsalvagableTokens[_underlying] = true;
    underlying = _underlying;
    vault = _vault;
    newVault = _newVault;
  }

  modifier restricted() {
    require(msg.sender == vault || msg.sender == address(controller()) || msg.sender == address(governance()),
      "The sender has to be the controller or vault or governance");
    _;
  }

  function depositArbCheck() public view override returns(bool) {
    return false; // disable deposits
  }

  modifier onlyVault() {
    require(msg.sender == address(vault), "The caller must be the vault");
    _;
  }

  /*
  * Returns the total amount.
  */
  function investedUnderlyingBalance() view public override returns (uint256) {
    return IBEP20(underlying).balanceOf(address(this));
  }

  /*
  * Invests all tokens that were accumulated so far
  */
  function investAllUnderlying() public {
    // a no-op
  }

  function setMigrator(address _migrator) external onlyGovernance {
    migrator = _migrator;
  }

  function rebalance() public {
    // a no-op
  }

  /*
  * withdraws to the vault (in case migration is aborted)
  */
  function withdrawAllToVault() external override restricted {
    uint256 balance = IBEP20(underlying).balanceOf(address(this));
    IBEP20(underlying).safeTransfer(address(vault), balance);
  }

  /*
  * Cashes some amount out and withdraws to the vault
  */
  function withdrawToVault(uint256 amountWei) external override restricted {
    revert("Withdraws through this strategy are disabled");
  }

  // initiates the migration. Assumes all underling balance is already
  // in the strategy (transferred from the vault by doHardWork)
  function migrateToNewVault() external onlyGovernance {
    uint256 entireUnderlyingBalance = IBEP20(underlying).balanceOf(address(this));

    uint256 newVaultBalanceBefore = IBEP20(underlying).balanceOf(newVault);
    IBEP20(underlying).safeApprove(newVault, 0);
    IBEP20(underlying).safeApprove(newVault, entireUnderlyingBalance);
    IVault(newVault).deposit(entireUnderlyingBalance);
    require(IBEP20(underlying).balanceOf(newVault).sub(newVaultBalanceBefore) == entireUnderlyingBalance, "underlying balance mismatch");

    uint256 entireShareBalance = IBEP20(newVault).balanceOf(address(this));

    require(migrator != address(0), "Migrator not set!");
    uint256 migratorBalanceBefore = IBEP20(newVault).balanceOf(migrator);
    IBEP20(newVault).safeApprove(migrator, 0);
    IBEP20(newVault).safeApprove(migrator, entireShareBalance);
    IMigrator(migrator).pullFromStrategy();
    require(IBEP20(newVault).balanceOf(migrator).sub(migratorBalanceBefore) == entireShareBalance, "share balance mismatch");
  }

  function doHardWork() external override onlyVault {
    // a no-op
  }

  // should only be called by controller
  function salvage(address destination, address token, uint256 amount) external override restricted {
    require(!unsalvagableTokens[token], "token is defined as not salvageable");
    IBEP20(token).safeTransfer(destination, amount);
  }
}