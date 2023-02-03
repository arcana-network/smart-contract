// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./ArcanaV1.sol";

/**
 * @title Arcana ACL
 * @dev Manages the ACL of the files uploaded to Arcana network
 */
contract Arcana is ArcanaV1 {
    bool public verification;

    event Unpartitioned(bool status);

    function setUnPartition(bool status) external onlyOwner {
        require(verification, "app_verification_pending");
        unpartitioned = status;
        emit Unpartitioned(status);
    }

    function setVerification(bool status) external onlyFactoryContract {
        require(verification != status, "status_already_assigned");
        if (!status) {
            unpartitioned = false;
        }
        verification = status;
        emit Unpartitioned(status);
    }
}
