// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import {Governable} from "./Governable.sol";

contract Controllable is Governable {

  constructor(address _storage) Governable(_storage) public {
  }

  modifier onlyController() {
    require(store.isController(msg.sender), "Not a controller");
    _;
  }

  modifier onlyControllerOrGovernance(){
    require((store.isController(msg.sender) || store.isGovernance(msg.sender)),
      "The caller must be controller or governance");
    _;
  }

  function controller() public view returns (address) {
    return store.controller();
  }
}
