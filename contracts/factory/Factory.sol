// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./FactoryV1.sol";

contract Factory is FactoryV1 {
    event AppVerified(address indexed app, bool indexed status);

    function setAppVerification(address appAddress, bool status) external onlyOwner {
        IArcanaFactory(appAddress).setVerification(status);
        emit AppVerified(appAddress, status);
    }
}
