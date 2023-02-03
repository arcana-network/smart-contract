# Solidity API

## DID

_Handles file data with identifier DID._

### APP_ROLE

```solidity
bytes32 APP_ROLE
```

### factory

```solidity
address factory
```

### files

```solidity
mapping(bytes32 => struct IDID.File) files
```

_Mapping of all the files in Arcana Network, did -> File details_

### onlyApp

```solidity
modifier onlyApp()
```

_only app role modifier_

### FilePermission

```solidity
event FilePermission(bytes32 did, uint8 control, address app, address user)
```

### NFTDownload

```solidity
event NFTDownload(bytes32 did, address user, uint256 chain_id, uint256 token_id, address nftContract)
```

### initialize

```solidity
function initialize(address _relayer, address _factory) public
```

_Act like an constructor for Initializable contract._

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

_upgrade the contract. Can only be done by owner of the contract._

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

_overrides msg.sender with the original sender, since it is proxy call. Implemented from ERC2771._

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | end user who initiated the meta transaction |

### getFileOwner

```solidity
function getFileOwner(bytes32 _did) public view returns (address)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | _owner owner of the file. |

### getFile

```solidity
function getFile(bytes32 _did) public view returns (uint256, bool, bytes32, bytes32, address)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | fileSize |
| [1] | bool | uploaded |
| [2] | bytes32 | storageNode |
| [3] | bytes32 |  |
| [4] | address |  |

### setFile

```solidity
function setFile(bytes32 _did, address _owner, uint256 _fileSize, bool _uploaded, bytes32 _name, bytes32 _fileHash, address _storageNode) public
```

_sets file data_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file |
| _owner | address | owner of the file |
| _fileSize | uint256 | size of the file |
| _uploaded | bool | bool whether file is uploaded or not |
| _name | bytes32 |  |
| _fileHash | bytes32 |  |
| _storageNode | address | Storage Node address |

### getRuleSet

```solidity
function getRuleSet(bytes32 _did) external view returns (bytes32)
```

_getter function to fetch download rule set_

### updateRuleSet

```solidity
function updateRuleSet(bytes32 _did, bytes32 _ruleHash) external
```

_Update download rule set_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 |  |
| _ruleHash | bytes32 | Download ruleHash |

### deleteFile

```solidity
function deleteFile(bytes32 _did) external
```

_Delete file from the files_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file |

### completeUpload

```solidity
function completeUpload(bytes32 _did) external
```

_Sets uploaded bool to true_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file |

### linkNFT

```solidity
function linkNFT(bytes32 _did, uint256 _tokenId, address _nftContract, uint256 _chainId) external
```

_Links NFT to the DID_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file which is unique identifier to a file |
| _tokenId | uint256 | tokenId of the NFT |
| _nftContract | address | NFT contract address |
| _chainId | uint256 | chainId of the chain where the NFTs are deployed on |

### downloadNFT

```solidity
function downloadNFT(bytes32 _did) external
```

### changeFileOwner

```solidity
function changeFileOwner(bytes32 _did, address _owner) external
```

_Transfers the ownership of the file_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file |
| _owner | address | new owner of the file |

### checkDelegatorPermission

```solidity
function checkDelegatorPermission(address _fileOwner, bytes32 _did, uint8 _control, address _requester) internal returns (bool, string)
```

### checkPermission

```solidity
function checkPermission(bytes32 _did, uint8 _control, address _requester) external returns (bool, string)
```

_checks file permission for the control  to be used by owner and App delegators_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | file did |
| _control | uint8 | access control type |
| _requester | address | permission requester (an EOA) |

