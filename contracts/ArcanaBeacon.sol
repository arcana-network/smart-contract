// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.8;

/**
 * @title Arcana Beacon
 * @dev Beacon contract that holds the current implementation of logic contract(Arcana.sol)
 */
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcanaBeacon is Ownable {
    address private blueprint;
    UpgradeableBeacon internal immutable beaconInstance;

    event ArcanaImplementation(address indexed source);

    constructor(address _initPrint) {
        require(_initPrint != address(0), "zero address");
        blueprint = _initPrint;
        beaconInstance = new UpgradeableBeacon(_initPrint);
        transferOwnership(tx.origin);
    }

    /// @dev updates to a new implementation
    function update(address newPrint) external onlyOwner {
        require(newPrint != address(0), "zero address");
        blueprint = newPrint;
        beaconInstance.upgradeTo(newPrint);
        emit ArcanaImplementation(newPrint);
    }

    /// @return _blueprint current implemtation address
    function implementation() external view returns (address _blueprint) {
        _blueprint = blueprint;
    }
}
