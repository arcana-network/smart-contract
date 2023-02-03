// SPDX-License-Identifier: MIT
//ONLY For Test Cases
pragma solidity 0.8.8;

import "../arcana/Arcana.sol";

contract ArcanaTestV2 is Arcana {
    //return version of contract, for testing purpose
    function version() public pure returns (string memory) {
        return "2";
    }
}
