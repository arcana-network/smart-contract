//// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

interface IForwarder {
    struct ForwardRequest {
        address from;
        address to;
        uint256 nonce;
        string method;
    }

    /**
     * @dev executess meta-transaction on the logic contract
     */
    function execute(
        ForwardRequest calldata req,
        bytes calldata signature,
        bytes calldata arcanaFunctionData
    ) external returns (bool, bytes memory);

    /**
     * @dev Fetch nonce fom provided address
     */
    function getNonce(address from) external view returns (uint256);
}
