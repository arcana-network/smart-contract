// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

interface IFactoryDID {
    function app(address _app) external view returns (address);
}
