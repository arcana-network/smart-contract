// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../ERC2771ContextUpgradeable.sol";
import "../interfaces/IArcana.sol";
import "../interfaces/IDID.sol";
import "../interfaces/IFactoryArcana.sol";
import "../RoleLib.sol";

/**
 * @title Arcana ACL
 * @dev Manages the ACL of the files uploaded to Arcana network
 */
contract ArcanaV1 is ERC2771ContextUpgradeable, OwnableUpgradeable, IArcana {
    using RoleLib for uint8;
    bool private active;

    enum WalletMode {
        NoUI,
        Full
    }

    /// @dev Wallet mode type - NoUI or Full
    WalletMode public walletType;

    //Compulsary access given to app
    uint8 public appLevelControl;
    //Delegators (app provided)
    ///@dev
    /*
        Download = 1; //001
        UpdateRuleSet = 2; //010
        Remove = 4;//100
        Transfer = 8;//1000
    */
    mapping(address => uint8) public delegators;

    mapping(address => uint8) public userAppPermission;
    //maintain user re-version
    mapping(bytes32 => FileInfo) public appFiles;

    mapping(address => uint256) public userVersion;

    /// @dev Mapping user => Limit (i.e, storage and bandwidth)
    mapping(address => Limit) public limit;
    /// @dev Resource consumption
    mapping(address => Limit) public consumption;

    /// @dev keeps track of transactionHashs used for download
    mapping(bytes32 => bool) public txCounter;

    /// @dev If this is true then DKG will generate same key for all the oAuth providers
    bool public aggregateLogin;

    /// @dev App config is hash of json string which has the app configuration like app name, client id, etc.
    bytes32 private _appConfig;

    /// @dev Factory contract address
    address internal factory;

    /// @dev File struct
    struct FileInfo {
        address owner;
        uint256 userVersion;
    }

    /* solhint-disable */
    /// @dev Default limit i.e, storage and bandwidth
    Limit public defaultLimit;
    /// @dev DID Interface contract
    IDID private didContract;
    /* solhint-enable */
    struct Limit {
        uint256 store;
        uint256 bandwidth;
    }

    bool public unpartitioned;

    /// @dev Checks if the caller is file owner before calling a function
    modifier onlyFileOwner(bytes32 _did) {
        require(_msgSender() == didContract.getFileOwner(_did), "only_file_owner");
        _;
    }
    /// @dev Only Factory contract can call the function when this modifier is used
    modifier onlyFactoryContract() {
        require(isFactoryContract(), "only_factory_contract");
        _;
    }

    /// @dev Checks upload limit while uploading a new file with new file size.
    modifier checkUploadLimit(uint256 _fileSize) {
        require(
            consumption[_msgSender()].store + _fileSize <= max(limit[_msgSender()].store, defaultLimit.store),
            "no_user_space"
        );
        require(consumption[address(0)].store + _fileSize <= limit[address(0)].store, "No space left for app");
        _;
    }

    event DownloadViaRuleSet(bytes32 did, address user);

    event DeleteApp(address owner);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

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
    ) external initializer {
        require(factoryAddress != address(0), "zero address");
        factory = factoryAddress;
        aggregateLogin = aggregateLoginValue;
        OwnableUpgradeable.__Ownable_init();
        ERC2771ContextUpgradeable.__ERC2771Context_init(relayer);
        didContract = IDID(did);
        _appConfig = appConfigValue;
        walletType = WalletMode.Full;
        active = true;
    }

    // @dev to check whether the contract is active or not
    function isActive() external view returns (bool) {
        return active;
    }

    /// @dev End user agreeing to app permission
    function grantAppPermission() external {
        require(userAppPermission[_msgSender()] != appLevelControl, "user_permission_already_granted");
        userAppPermission[_msgSender()] = appLevelControl;
    }

    /// @dev Used for exiting the app
    function revokeApp() external {
        userVersion[_msgSender()] += 1;
        userAppPermission[_msgSender()] = 0;
    }

    /**
     * @dev App owner will use this to edit app level permission
     * @param appPermission New permission
     * @param add Specifies whether above permission is added or removed
     */
    function editAppPermission(uint8 appPermission, bool add) external onlyOwner {
        if (add) {
            appLevelControl = appLevelControl.grantRole(appPermission);
        } else {
            appLevelControl = appLevelControl.revokeRole(appPermission);
        }
    }

    /**
     * @dev Add/Remove/Update a new delegator to app
     * @param delegator Address of the new/existing delegator
     * @param control Control for delegator
     * @param add Specifies whether above control is added or removed
     */
    function updateDelegator(address delegator, uint8 control, bool add) external onlyOwner {
        //check if permission is added to app level
        if (add) {
            require(appLevelControl.hasRole(control), "app_level_permission_not_found");
            delegators[delegator] = delegators[delegator].grantRole(control);
        } else {
            delegators[delegator] = delegators[delegator].revokeRole(control);
        }
    }

    /// @return uint256 Maximum of two numbers
    function max(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a : b;
    }

    /// @dev Checks if msg.sender is Factory contract
    function isFactoryContract() internal view returns (bool) {
        return msg.sender == address(factory);
    }

    /**
     * @dev overrides msg.sender with the original sender, since it is proxy call. Implemented from ERC2771.
     * @return sender end user who initiated the meta transaction
     */
    function _msgSender() internal view virtual override returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            // solhint-disable-next-line
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            require(isFactoryContract(), "non_trusted_forwarder_or_factory");
            return super._msgSender();
        }
    }

    /**
     * @dev To add already uploaded file to this app
     * @param did Did of the file that is getting added
     */
    function addFile(bytes32 did) external onlyFileOwner(did) {
        address _fileOwner = didContract.getFileOwner(did);
        (uint256 _fileSize, bool _uploaded, , , ) = didContract.getFile(did);
        require(_uploaded, "file_not_uploaded_yet");
        require(appFiles[did].userVersion == userVersion[_fileOwner], "file_already_added");
        consumption[_fileOwner].store += _fileSize;
        consumption[address(0)].store += _fileSize;
        appFiles[did] = FileInfo(_fileOwner, userVersion[_fileOwner]);
        (bool status, string memory err) = didContract.checkPermission(did, 0, _msgSender());
        require(status, err);
    }

    /**
     * @dev remove user file via owner or delegator from the app
     * @param did did of the file to be removed
     */
    function removeUserFile(bytes32 did) external {
        (bool status, string memory err) = didContract.checkPermission(did, 4, _msgSender());
        require(status, err);
        appFiles[did] = FileInfo(address(0), 0);
    }

    /**
     * @dev Executed before uploading the file. This function will be called by the client
     * @param did DID of the file which is unique identifier to a file
     * @param fileSize Size of the file
     * @param name file name hash, value stored in db
     * @param fileHash file hash
     * @param storageNode Storage Node address
     * @param ephemeralAddress This address is used to sign the message in upload transaction
     */

    function uploadInit(
        bytes32 did,
        uint256 fileSize,
        bytes32 name,
        bytes32 fileHash,
        address storageNode, // solhint-disable-next-line
        address ephemeralAddress
    ) external checkUploadLimit(fileSize) {
        uint8 _userPerm = userAppPermission[_msgSender()];
        require(_userPerm.hasRole(appLevelControl), "permission_not_granted");
        require(didContract.getFileOwner(did) == address(0), "owner_already_exists");
        require(fileSize != 0, "zero_file_size");
        appFiles[did] = FileInfo(_msgSender(), userVersion[_msgSender()]);
        didContract.setFile(did, _msgSender(), fileSize, false, name, fileHash, storageNode);
        //check if storageNode is registered with factory
        require(IFactoryArcana(factory).isNode(storageNode), "storage_node_not_found");
    }

    /**
     * @dev Executed after uploading the file
     * If the function fails then uploaded must be deleted from the arcana network
     * @param did DID of the file which is unique identifier to a file
     */
    function uploadClose(bytes32 did) external {
        (uint256 _fileSize, bool _uploaded, , , address _storageNode) = didContract.getFile(did);
        // As this function is called directly by storage node there is no need of meta tx(_msgSender)
        require(msg.sender == _storageNode, "only_storage_node");
        require(!_uploaded, "file_already_uploaded");
        consumption[didContract.getFileOwner(did)].store += _fileSize;
        consumption[address(0)].store += _fileSize;
        didContract.completeUpload(did);
        (bool status, string memory err) = didContract.checkPermission(did, 0, didContract.getFileOwner(did));
        require(status, err);
    }

    /**
     * @dev download file by delegator or owner
     * @param did file to be downloaded
     * @param ephemeralWallet This address is used to sign the message in upload transaction
     */
    function download(bytes32 did, address ephemeralWallet) external {
        (uint256 _fileSize, bool _uploaded, , , ) = didContract.getFile(did);
        require(_uploaded, "file_not_found");
        require(
            max(defaultLimit.bandwidth, limit[_msgSender()].bandwidth) >=
                consumption[_msgSender()].bandwidth + _fileSize,
            "user_bandwidth_limit_reached"
        );
        require(
            limit[address(0)].bandwidth >= consumption[address(0)].bandwidth + _fileSize,
            "app_bandwidth_limit_reached"
        );

        consumption[_msgSender()].bandwidth += _fileSize;
        (bool status, ) = didContract.checkPermission(did, 1, _msgSender());
        if (!status) {
            emit DownloadViaRuleSet(did, _msgSender());
            consumption[address(0)].bandwidth += _fileSize;
        }
    }

    /**
     * @dev download closure for bandwidth computation by storage nodes
     * @param did file that being downloaded
     * @param txHash tx hash that used for downlaoding file
     */
    function downloadClose(bytes32 did, bytes32 txHash) external {
        (uint256 _fileSize, , , , ) = didContract.getFile(did);
        //check if transaction hash already there
        require(!txCounter[txHash], "tx_hash_already_used");
        txCounter[txHash] = true;
        consumption[address(0)].bandwidth += _fileSize;
        //check if caller is storage node
        require(IFactoryArcana(factory).isNode(msg.sender), "only_storage_node");
    }

    /**
     * @dev This used for sharing and revoking
     * @param did did of the file
     * @param ruleHash updated rule set
     */
    function updateRuleSet(bytes32 did, bytes32 ruleHash) external {
        (bool status, string memory err) = didContract.checkPermission(did, 2, _msgSender());
        require(status, err);
        didContract.updateRuleSet(did, ruleHash);
    }

    /**
     * @dev This used for changing file owner
     * @param did did of the file
     * @param newOwner new file owner
     */
    function changeFileOwner(bytes32 did, address newOwner) external {
        (bool status, string memory err) = didContract.checkPermission(did, 8, _msgSender());
        require(status, err);
        didContract.changeFileOwner(did, newOwner);
    }

    /**
     * @dev sets app level storage and bandwidth limit
     * @param store storage limit
     * @param bandwidth bandwidth limit
     */
    function setAppLimit(uint256 store, uint256 bandwidth) external onlyFactoryContract {
        limit[address(0)] = Limit(store, bandwidth);
    }

    /**
     * @dev sets user level storage and bandwidth limit
     * @param user user address
     * @param store storage limit
     * @param bandwidth bandwidth limit
     */
    function setUserLevelLimit(address user, uint256 store, uint256 bandwidth) external onlyOwner {
        limit[user] = Limit(store, bandwidth);
    }

    /**
     * @dev sets app level storage and bandwidth limit with default values
     * @param store storage limit
     * @param bandwidth bandwidth limit
     */
    function setDefaultLimit(uint256 store, uint256 bandwidth) external onlyOwner {
        defaultLimit = Limit(store, bandwidth);
    }

    /**
     * @dev Links NFT to the DID
     * @param did DID of the file which is unique identifier to a file
     * @param tokenId tokenId of the NFT
     * @param nftContract NFT contract address
     * @param chainId chainId of the chain where the NFTs are deployed on
     */
    function linkNFT(bytes32 did, uint256 tokenId, address nftContract, uint256 chainId) external onlyFileOwner(did) {
        didContract.linkNFT(did, tokenId, nftContract, chainId);
    }

    /**
     * @dev Fetch app configuration
     */
    function getAppConfig() external view returns (bytes32) {
        return _appConfig;
    }

    /**
     * @dev Set app configuration
     * @param appConfig app configuration
     */
    function setAppConfig(bytes32 appConfig) external onlyOwner {
        _appConfig = appConfig;
    }

    /**
     @dev Toggle wallet type
     */
    function toggleWalletType() external onlyFactoryContract {
        if (walletType == WalletMode.Full) {
            walletType = WalletMode.NoUI;
        } else {
            walletType = WalletMode.Full;
        }
    }

    /**
     @dev Destroy's the App from blockchain
     */
    function deleteApp() external onlyOwner {
        active = false;
        emit DeleteApp(_msgSender());
    }

    function setUnPartitioned(bool status) external onlyFactoryContract {
        unpartitioned = status;
    }
}
