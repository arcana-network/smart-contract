// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

// import "./IArcanaDID.sol";
// import "./IArcanaFactory.sol";
// import "./IArcanaForwarder.sol";

/// @dev Interface for Arcana logic contract
interface IArcana {
    /**
     * @dev Act like an constructor for Initializable contract
     * Sets app and owner of the app
     * @param factoryAddress factory contract address
     * @param relayer forwarder contract address
     * @param aggregateLoginValue if true, then DKG will generate same key for all OAuth providers
     * @param did DID contract address
     * @param appConfigValue  app config hash
     */
    function initialize(
        address factoryAddress,
        address relayer,
        bool aggregateLoginValue,
        address did,
        bytes32 appConfigValue
    ) external;

    /// @dev If this is true then DKG will generate same key for all the oAuth providers
    function aggregateLogin() external returns (bool);

    /**
     * @dev Set app configuration
     * @param appConfig app configuration
     */
    function setAppConfig(bytes32 appConfig) external;
}
