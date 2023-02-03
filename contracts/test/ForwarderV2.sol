// SPDX-License-Identifier: MIT
//ONLY For Test Cases
pragma solidity 0.8.8;

import "../Forwarder.sol";

/**
 * @title Factory Contract
 * Create New ERC1967Proxy for each new app
 */
contract ForwarderTestV2 is Forwarder {
    function version() external pure returns (string memory ver) {
        ver = "2";
    }
}
