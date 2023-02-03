// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "./IFactoryArcana.sol";
import "./IFactoryDID.sol";
import "./IFactoryForwarder.sol";

interface IFactory is IFactoryArcana, IFactoryDID, IFactoryForwarder {
    /**
     * @dev Create new app using beacon proxy
     * @param _onlyDKGAddress Only allow wallets created from Arcana DKG to make transactions
     * @param _owner owner of the app
     * @param _store storage limit of the app
     * @param _bandwidth badnwidth limit of the app
     * @param _relayer forwarder contract address
     * @param _aggregateLogin if true, then DKG will generate same key for all OAuth providers
     */
    function createNewApp(
        address _owner,
        uint256 _store,
        uint256 _bandwidth,
        address _relayer,
        bool _onlyDKGAddress,
        bool _aggregateLogin,
        bytes32 _appConfig
    ) external;

    /**
     * @dev set default storage and bandwidth limits
     */
    function setDefaultLimit(uint256 _storage, uint256 _bandwidth) external;

    /**
     * @dev set app level storage and bandwidth limits
     */
    function setAppLevelLimit(address _app, uint256 store, uint256 bandwidth) external;
}
