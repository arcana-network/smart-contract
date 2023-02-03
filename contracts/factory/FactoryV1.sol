// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../interfaces/IFactory.sol";
import "../interfaces/IArcanaFactory.sol";
import "../ArcanaBeacon.sol";

/**
 * @title Factory Contract
 * @dev Create New beacon proxy for each new app
 */
contract FactoryV1 is IFactory, Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    /// @dev App contract => owner of the app
    mapping(address => address) public app;
    /// @dev app =>  user =>  node => vote
    mapping(address => mapping(address => mapping(address => bool))) private voteUserRegistration;
    /// @dev app => user => vote
    mapping(address => mapping(address => uint256)) private totalVotes;
    /// @dev app => bool (if true only allow Arcana created wallets to make transactions)
    mapping(address => bool) public onlyDKGAddress;

    /// @dev Default storage limit for apps
    uint256 public defaultStorage;

    /// @dev Default bandwidth limit for apps
    uint256 public defaultBandwidth;

    /// @dev Emits new app details
    event NewApp(address owner, address appProxy);

    mapping(address => bool) public isNode;

    mapping(address => PublicKey) private _gateway;
    /// @dev Arcana beacon contract instance
    ArcanaBeacon private arcanaBeacon;
    /// @dev DID contract address
    address public did;

    event GatewayNode(address indexed node);

    event StorageNode(address indexed node, bool isActive);

    event DefaultLimit(uint256 store, uint256 bandwidth);

    event AppLevelLimit(address indexed app, uint256 store, uint256 bandwidth);

    event UnPartitionedApp(address indexed app, bool indexed status);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Act like an constructor for Initializable contract
     * Creates new beacon contract with initial logic implementation
     * @param initBluePrint Arcana logic contract address
     */
    function initialize(address initBluePrint) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        arcanaBeacon = new ArcanaBeacon(initBluePrint);
    }

    /**
     * @dev sets DID address
     * @param didAddress DID contract address
     */
    function setDID(address didAddress) external onlyOwner {
        require(didAddress != address(0), "zero address");
        did = didAddress;
    }

    /**
     * @return publicKey of the gateway node
     * @param nodeAddress gateway node address
     */
    function gateway(address nodeAddress) external view override returns (PublicKey memory) {
        return _gateway[nodeAddress];
    }

    // solhint-disable-next-line
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @param node gateway node address
     * @param x x co-ordinate of public key
     * @param y y co-ordinate of public key
     */
    function modifyGateway(address node, bytes32 x, bytes32 y) external onlyOwner {
        _gateway[node] = PublicKey(x, y);
    }

    modifier gatewayNodeOrOwner() {
        if (_msgSender() != owner()) {
            require(_gateway[msg.sender].x != bytes32(0), "Only gateway node can call this function");
        }
        _;
    }

    /**
     * @dev Create new app using beacon proxy
     * @param onlyDkgAddress Only allow wallets created from Arcana DKG to make transactions
     * @param appOwner Owner of the app
     * @param store Storage limit of the app
     * @param bandwidth Badnwidth limit of the app
     * @param relayer Forwarder contract address
     * @param aggregateLogin If true, then DKG will generate same key for all OAuth providers
     * @param appConfig App configuration
     */
    function createNewApp(
        address appOwner,
        uint256 store,
        uint256 bandwidth,
        address relayer,
        bool onlyDkgAddress,
        bool aggregateLogin,
        bytes32 appConfig
    ) external gatewayNodeOrOwner nonReentrant {
        BeaconProxy proxy = new BeaconProxy(
            address(arcanaBeacon),
            abi.encodeWithSignature(
                "initialize(address,address,bool,address,bytes32)",
                address(this),
                relayer,
                aggregateLogin,
                did,
                appConfig
            )
        );

        setAppLevelLimit(address(proxy), defaultStorage, defaultBandwidth);
        OwnableUpgradeable ownable = OwnableUpgradeable(address(proxy));
        IArcanaFactory arcana = IArcanaFactory(address(proxy));
        arcana.setDefaultLimit(store, bandwidth);
        ownable.transferOwnership(appOwner);
        app[address(proxy)] = appOwner;
        onlyDKGAddress[address(proxy)] = onlyDkgAddress;
        emit NewApp(appOwner, address(proxy));
    }

    /**
     * @dev Add or remove nodes in the network
     * @param node address of the node that is being modified
     * @param value if True node is added to the network else node is not part of the network
     */
    function modifyNode(address node, bool value) external onlyOwner {
        require(isNode[node] != value, "No change in value");
        isNode[node] = value;
        emit StorageNode(node, value);
    }

    /**
     * @dev Set default storage and bandwidth limits
     * @param store Default sotrage limit
     * @param bandwidth Default bandwidth
     */
    function setDefaultLimit(uint256 store, uint256 bandwidth) external override onlyOwner {
        defaultStorage = store;
        defaultBandwidth = bandwidth;
        emit DefaultLimit(store, bandwidth);
    }

    /**
     * @dev Set app level storage and bandwidth limits
     * @param appAddress Address of the app
     * @param store App level storage limit
     * @param bandwidth App level bandwidth
     */
    function setAppLevelLimit(address appAddress, uint256 store, uint256 bandwidth) public override gatewayNodeOrOwner {
        IArcanaFactory arcana = IArcanaFactory(appAddress);
        arcana.setAppLimit(store, bandwidth);
        emit AppLevelLimit(appAddress, store, bandwidth);
    }

    /**
     @dev Toggle wallet type
     * @param appAddress Address of the app
     */
    function toggleWalletType(address appAddress) external onlyOwner {
        IArcanaFactory arcana = IArcanaFactory(appAddress);
        arcana.toggleWalletType();
    }

    /// @return _arcanaBeacon Address of Arcana Beacon contract
    function getBeacon() external view returns (address _arcanaBeacon) {
        _arcanaBeacon = address(arcanaBeacon);
    }

    /// @return _implementation Get the implementaiton contract address
    function getImplementation() external view returns (address _implementation) {
        _implementation = arcanaBeacon.implementation();
    }

    function setUnPartition(address appAddress, bool status) external onlyOwner {
        IArcanaFactory arcana = IArcanaFactory(appAddress);
        arcana.setUnPartitioned(status);
        emit UnPartitionedApp(appAddress, status);
    }
}
