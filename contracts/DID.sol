// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./ERC2771ContextUpgradeable.sol";
import "./interfaces/IDID.sol";
import "./interfaces/IFactoryDID.sol";
import "./interfaces/IArcanaDID.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "./RoleLib.sol";

/**
 * @title DID
 * @dev Handles file data with identifier DID.
 */
contract DID is ERC2771ContextUpgradeable, UUPSUpgradeable, OwnableUpgradeable, IDID {
    using RoleLib for uint8;

    address internal factory;
    /// @dev Mapping of all the files in Arcana Network, did -> File details
    mapping(bytes32 => File) private files;

    /// @dev only app role modifier
    modifier onlyApp() {
        require(IFactoryDID(factory).app(msg.sender) != address(0), "caller_should_be_app");
        _;
    }

    event FilePermission(bytes32 indexed did, uint8 indexed control, address indexed app, address user);

    event NFTDownload(bytes32 indexed did, address indexed user, uint256 chainId, uint256 tokenId, address nftContract);

    event SetFactory(address _factory);

    event UpgradeAuth();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Act like an constructor for Initializable contract.
     */
    function initialize(address relayer, address factoryAddress) public initializer {
        require(factoryAddress != address(0), "zero address");
        factory = factoryAddress;
        __Ownable_init();
        __UUPSUpgradeable_init();
        ERC2771ContextUpgradeable.__ERC2771Context_init(relayer);
        emit SetFactory(factoryAddress);
    }

    /// @dev upgrade the contract. Can only be done by owner of the contract.
    // solhint-disable-next-line
    function _authorizeUpgrade(address) internal override onlyOwner {
        emit UpgradeAuth();
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
        }
    }

    /**
     * @param did DID of the file
     * @return _owner owner of the file.
     */
    function getFileOwner(bytes32 did) public view returns (address) {
        return files[did].owner;
    }

    /**
     * @param did DID of the file
     * @return fileSize
     * @return uploaded
     * @return storageNode
     */
    function getFile(bytes32 did) external view returns (uint256, bool, bytes32, bytes32, address) {
        return (files[did].fileSize, files[did].uploaded, files[did].name, files[did].fileHash, files[did].storageNode);
    }

    /**
     * @dev   sets file data
     * @param did DID of the file
     * @param fileOwner owner of the file
     * @param fileSize size of the file
     * @param uploaded bool whether file is uploaded or not
     * @param storageNode Storage Node address
     */
    function setFile(
        bytes32 did,
        address fileOwner,
        uint256 fileSize,
        bool uploaded,
        bytes32 name,
        bytes32 fileHash,
        address storageNode
    ) external onlyApp {
        files[did].owner = fileOwner;
        files[did].fileSize = fileSize;
        files[did].uploaded = uploaded;
        files[did].name = name;
        files[did].fileHash = fileHash;
        files[did].storageNode = storageNode;
    }

    /**
     * @dev getter function to fetch download rule set
     */
    function getRuleSet(bytes32 did) external view returns (bytes32) {
        return files[did].controlRules[1];
    }

    /**
     * @dev Update download rule set
     * @param ruleHash Download ruleHash
     */
    function updateRuleSet(bytes32 did, bytes32 ruleHash) external onlyApp {
        files[did].controlRules[1] = ruleHash;
    }

    /**
     * @dev Delete file from the files
     * @param did DID of the file
     */
    function deleteFile(bytes32 did) external {
        address _fileOwner = getFileOwner(did);
        require(_msgSender() == _fileOwner, "only_file_owner");
        //Reset Ruleset on file deletion
        files[did].controlRules[1] = bytes32(0);
        delete files[did];
    }

    /**
     * @dev Sets uploaded bool to true
     * @param did DID of the file
     */
    function completeUpload(bytes32 did) external onlyApp {
        files[did].uploaded = true;
    }

    /**
     * @dev Links NFT to the DID
     * @param did DID of the file which is unique identifier to a file
     * @param tokenId tokenId of the NFT
     * @param nftContract NFT contract address
     * @param chainId chainId of the chain where the NFTs are deployed on
     */
    function linkNFT(bytes32 did, uint256 tokenId, address nftContract, uint256 chainId) external onlyApp {
        NFTInfo memory _nftInfo = NFTInfo(chainId, tokenId, nftContract);
        files[did].controlRules[1] = bytes32(0);
        files[did].owner = address(0);
        files[did].nftDetails = _nftInfo;
    }

    function downloadNFT(bytes32 did) external {
        require(files[did].nftDetails.contractAddress != address(0), "nft_downlaod_only");
        emit NFTDownload(
            did,
            _msgSender(),
            files[did].nftDetails.chainId,
            files[did].nftDetails.tokenId,
            files[did].nftDetails.contractAddress
        );
    }

    /**
     * @dev Transfers the ownership of the file
     * @param did DID of the file
     * @param newFileOwner new owner of the file
     */
    function changeFileOwner(bytes32 did, address newFileOwner) external onlyApp {
        require(files[did].nftDetails.contractAddress == address(0), "owner_is_nft");
        files[did].owner = newFileOwner;
    }

    function checkDelegatorPermission(
        address fileOwner,
        bytes32 did,
        uint8 control,
        address requester
    ) internal returns (bool, string memory) {
        if (
            !(IArcanaDID(msg.sender).appLevelControl().hasRole(control) &&
                IArcanaDID(msg.sender).delegators(requester).hasRole(control))
        ) {
            return (false, "delegator_permission_not_found");
        }
        ///@dev if file got delete or linked to NFT, let delegator remove file
        if (fileOwner == address(0) && IArcanaDID(msg.sender).appFiles(did).owner != address(0) && control == 4) {
            emit FilePermission(did, 4, msg.sender, requester);
            return (true, "");
        }

        if (IArcanaDID(msg.sender).appFiles(did).userVersion != IArcanaDID(msg.sender).userVersion(fileOwner)) {
            return (false, "file_version_mismatch");
        }
        if (!(IArcanaDID(msg.sender).userAppPermission(fileOwner).hasRole(control))) {
            return (false, "user_permission_not_granted");
        }
        if (IArcanaDID(msg.sender).appFiles(did).owner != fileOwner) {
            return (false, "file_not_added_by_owner");
        }
        emit FilePermission(did, control, msg.sender, requester);
        return (true, "");
    }

    /**
     * @dev checks file permission for the control  to be used by owner and App delegators
     * @param did file did
     * @param control access control type
     * @param requester permission requester (an EOA)
     */
    function checkPermission(
        bytes32 did,
        uint8 control,
        address requester
    ) external onlyApp returns (bool, string memory) {
        address _fileOwner = getFileOwner(did);
        ///@dev allow only remove operation for NFT or deleted file
        if (_fileOwner == address(0) && control != 4) {
            return (false, "only_remove_op_allowed");
        }
        if (requester == _fileOwner) {
            if (IArcanaDID(msg.sender).appFiles(did).userVersion != IArcanaDID(msg.sender).userVersion(_fileOwner)) {
                return (false, "file_version_mismatch");
            }
            emit FilePermission(did, control, msg.sender, _fileOwner);
            return (true, "");
        } else {
            return checkDelegatorPermission(_fileOwner, did, control, requester);
        }
    }
}
