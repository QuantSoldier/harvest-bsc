// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "./VaultProxy.sol";
import "./Vault.sol";
import "./Controllable.sol";

contract VaultFactory is Controllable {

  event NewVault(address vault);

  constructor(address _storage) Controllable(_storage) public {}

  function createVault(
    address _implementation,
    address _storage,
    address _underlying,
    uint256 _toInvestNumerator,
    uint256 _toInvestDenominator
  ) public onlyGovernance returns(address) {
    // VaultProxy proxy = new VaultProxy(_implementation);
    VaultProxy proxy = new VaultProxy();
    Vault(address(proxy)).initializeVault(
      _storage,
      _underlying,
      _toInvestNumerator,
      _toInvestDenominator
    );
    emit NewVault(address(proxy));
    return address(proxy);
  }
}
