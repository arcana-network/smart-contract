// SPDX-License-Identifier: MIT
//ONLY For Test Cases
pragma solidity 0.8.8;

import "../factory/Factory.sol";

/**
 * @title Factory Contract
 * Create New ERC1967Proxy for each new app
 */
contract FactoryTestV2 is Factory {
    function version() external pure returns (string memory ver) {
        ver = "2";
    }
}
