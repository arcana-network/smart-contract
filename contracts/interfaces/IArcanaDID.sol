// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

interface IArcanaDID {
    function userAppPermission(address _user) external view returns (uint8);

    function appLevelControl() external view returns (uint8);

    function delegators(address _user) external view returns (uint8);

    /// @dev File struct
    struct FileInfo {
        address owner;
        uint256 userVersion;
    }

    function userVersion(address _user) external view returns (uint256);

    function appFiles(bytes32 _did) external view returns (FileInfo memory);
}
