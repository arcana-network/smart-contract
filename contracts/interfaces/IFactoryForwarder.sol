// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./IFactoryDID.sol";

interface IFactoryForwarder is IFactoryDID {
    struct PublicKey {
        bytes32 x;
        bytes32 y;
    }

    function gateway(address _address) external returns (PublicKey memory);

    function did() external returns (address);
}
