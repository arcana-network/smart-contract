// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

interface IArcanaFactory {
    function setAppLimit(uint256 store, uint256 bandwidth) external;

    function setDefaultLimit(uint256 store, uint256 bandwidth) external;

    function toggleWalletType() external;

    function setVerification(bool status) external;

    function setUnPartitioned(bool status) external;
}
