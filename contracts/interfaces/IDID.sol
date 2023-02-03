// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

/// @dev Interface for DID contract
interface IDID {
    // Contains file meta data
    struct File {
        address owner;
        uint256 fileSize;
        bool uploaded;
        bytes32 name;
        bytes32 fileHash;
        // Download 1; //001
        // Delete = 2; //010
        // Transfer = 4; //100
        address storageNode;
        NFTInfo nftDetails;
        mapping(uint8 => bytes32) controlRules; // Only Download is enabled for now, rest of them are for future profing
    }

    struct NFTInfo {
        uint256 chainId;
        uint256 tokenId;
        address contractAddress;
    }

    function linkNFT(bytes32 _did, uint256 _tokenId, address _nftContract, uint256 _chainId) external;

    /**
     * @param _did DID of the file
     * @return _owner owner of the file.
     */
    function getFileOwner(bytes32 _did) external view returns (address);

    /**
     * @dev   sets file data
     * @param _did DID of the file
     * @param _owner owner of the file
     * @param _fileSize size of the file
     * @param _uploaded bool whether file is uploaded or not
     * @param _storageNode Storage Node address
     */
    function setFile(
        bytes32 _did,
        address _owner,
        uint256 _fileSize,
        bool _uploaded,
        bytes32 _name,
        bytes32 _fileHash,
        address _storageNode
    ) external;

    /* *
     * @param _did DID of the file
     * @return _File file data
     */
    function getFile(
        bytes32 _did
    ) external view returns (uint256 fileSize, bool uploaded, bytes32 _name, bytes32 _fileHash, address storageNode);

    /**
     * @dev Delete file from the files
     * @param _did DID of the file
     */
    function deleteFile(bytes32 _did) external;

    /**
     * @dev Sets uploaded bool to true
     * @param _did DID of the file
     */
    function completeUpload(bytes32 _did) external;

    /**
     * @dev Transfers the ownership of the file
     * @param _did DID of the file
     * @param _owner new owner of the file
     */
    function changeFileOwner(bytes32 _did, address _owner) external;

    function checkPermission(bytes32 _did, uint8 _control, address _requester) external returns (bool, string memory);

    function updateRuleSet(bytes32 _did, bytes32 _ruleHash) external;

    function getRuleSet(bytes32 _did) external view returns (bytes32);
}
