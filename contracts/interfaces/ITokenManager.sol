// SPDX-License-Identifier: MIT

pragma solidity 0.5.16;

interface ITokenManager {
    function mirror(address bep20Addr, uint64 expireTime) payable external returns (bool);
}