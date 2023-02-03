# Solidity API

## Arcana

_Manages the ACL of the files uploaded to Arcana network_

### WalletMode

```solidity
enum WalletMode {
  NoUI,
  Full
}
```

### walletType

```solidity
enum Arcana.WalletMode walletType
```

_Wallet mode type - NoUI or Full_

### appLevelControl

```solidity
uint8 appLevelControl
```

### delegators

```solidity
mapping(address => uint8) delegators
```

@dev

### userAppPermission

```solidity
mapping(address => uint8) userAppPermission
```

### appFiles

```solidity
mapping(bytes32 => struct Arcana.FileInfo) appFiles
```

### userVersion

```solidity
mapping(address => uint256) userVersion
```

### limit

```solidity
mapping(address => struct Arcana.Limit) limit
```

_Mapping user => Limit (i.e, storage and bandwidth)_

### consumption

```solidity
mapping(address => struct Arcana.Limit) consumption
```

_Resource consumption_

### txCounter

```solidity
mapping(bytes32 => bool) txCounter
```

_keeps track of transactionHashs used for download_

### aggregateLogin

```solidity
bool aggregateLogin
```

_If this is true then DKG will generate same key for all the oAuth providers_

### _appConfig

```solidity
bytes32 _appConfig
```

_App config is hash of json string which has the app configuration like app name, client id, etc._

### factory

```solidity
address factory
```

_Factory contract address_

### FileInfo

```solidity
struct FileInfo {
  address owner;
  uint256 userVersion;
}
```

### defaultLimit

```solidity
struct Arcana.Limit defaultLimit
```

_Default limit i.e, storage and bandwidth_

### DID

```solidity
contract IDID DID
```

_DID Interface contract_

### Limit

```solidity
struct Limit {
  uint256 store;
  uint256 bandwidth;
}
```

### onlyFileOwner

```solidity
modifier onlyFileOwner(bytes32 _did)
```

_Checks if the caller is file owner before calling a function_

### onlyFactoryContract

```solidity
modifier onlyFactoryContract()
```

_Only Factory contract can call the function when this modifier is used_

### checkUploadLimit

```solidity
modifier checkUploadLimit(uint256 _fileSize)
```

_Checks upload limit while uploading a new file with new file size._

### DownloadViaRuleSet

```solidity
event DownloadViaRuleSet(bytes32 did, address user)
```

### DeleteApp

```solidity
event DeleteApp(address owner)
```

### initialize

```solidity
function initialize(address _factory, address _relayer, bool _aggregateLogin, address _did, bytes32 _appConfigValue) public
```

_Act like an constructor for Initializable contract
Sets app and owner of the app_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _factory | address | factory contract address |
| _relayer | address | forwarder contract address |
| _aggregateLogin | bool | if true, then DKG will generate same key for all OAuth providers |
| _did | address | DID contract address |
| _appConfigValue | bytes32 | app config hash |

### grantAppPermission

```solidity
function grantAppPermission() external
```

_End user agreeing to app permission_

### revokeApp

```solidity
function revokeApp() external
```

_Used for exiting the app_

### editAppPermission

```solidity
function editAppPermission(uint8 _appPermission, bool _add) external
```

_App owner will use this to edit app level permission_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _appPermission | uint8 | New permission |
| _add | bool | Specifies whether above permission is added or removed |

### updateDelegator

```solidity
function updateDelegator(address _delegator, uint8 _control, bool _add) external
```

_Add/Remove/Update a new delegator to app_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _delegator | address | Address of the new/existing delegator |
| _control | uint8 | Control for delegator |
| _add | bool | Specifies whether above control is added or removed |

### max

```solidity
function max(uint256 a, uint256 b) private pure returns (uint256)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint256 Maximum of two numbers |

### isFactoryContract

```solidity
function isFactoryContract() internal view returns (bool)
```

_Checks if msg.sender is Factory contract_

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address sender)
```

_overrides msg.sender with the original sender, since it is proxy call. Implemented from ERC2771._

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | end user who initiated the meta transaction |

### addFile

```solidity
function addFile(bytes32 did) external
```

_To add already uploaded file to this app_

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | Did of the file that is getting added |

### removeUserFile

```solidity
function removeUserFile(bytes32 _did) external
```

_remove user file via owner or delegator from the app_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | did of the file to be removed |

### uploadInit

```solidity
function uploadInit(bytes32 did, uint256 fileSize, bytes32 name, bytes32 fileHash, address storageNode, address ephemeralAddress) external
```

_Executed before uploading the file. This function will be called by the client_

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | DID of the file which is unique identifier to a file |
| fileSize | uint256 | Size of the file |
| name | bytes32 | file name hash, value stored in db |
| fileHash | bytes32 | file hash |
| storageNode | address | Storage Node address |
| ephemeralAddress | address | This address is used to sign the message in upload transaction |

### uploadClose

```solidity
function uploadClose(bytes32 _did) external
```

_Executed after uploading the file
If the function fails then uploaded must be deleted from the arcana network_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | DID of the file which is unique identifier to a file |

### download

```solidity
function download(bytes32 did, address ephemeralWallet) external
```

_download file by delegator or owner_

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | file to be downloaded |
| ephemeralWallet | address | This address is used to sign the message in upload transaction |

### downloadClose

```solidity
function downloadClose(bytes32 did, bytes32 txHash) external
```

_download closure for bandwidth computation by storage nodes_

| Name | Type | Description |
| ---- | ---- | ----------- |
| did | bytes32 | file that being downloaded |
| txHash | bytes32 | tx hash that used for downlaoding file |

### updateRuleSet

```solidity
function updateRuleSet(bytes32 _did, bytes32 _ruleHash) external
```

_This used for sharing and revoking_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | did of the file |
| _ruleHash | bytes32 | updated rule set |

### changeFileOwner

```solidity
function changeFileOwner(bytes32 _did, address _newOwner) external
```

_This used for changing file owner_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | bytes32 | did of the file |
| _newOwner | address | new file owner |

### setAppLimit

```solidity
function setAppLimit(uint256 _store, uint256 _bandwidth) public
```

_sets app level storage and bandwidth limit_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _store | uint256 | storage limit |
| _bandwidth | uint256 | bandwidth limit |

### setUserLevelLimit

```solidity
function setUserLevelLimit(address _user, uint256 _store, uint256 _bandwidth) public
```

_sets user level storage and bandwidth limit_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | user address |
| _store | uint256 | storage limit |
| _bandwidth | uint256 | bandwidth limit |

### setDefaultLimit

```solidity
function setDefaultLimit(uint256 _store, uint256 _bandwidth) external
```

_sets app level storage and bandwidth limit with default values_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _store | uint256 | storage limit |
| _bandwidth | uint256 | bandwidth limit |

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

### getAppConfig

```solidity
function getAppConfig() external view returns (bytes32)
```

_Fetch app configuration_

### setAppConfig

```solidity
function setAppConfig(bytes32 appConfig) external
```

_Set app configuration_

| Name | Type | Description |
| ---- | ---- | ----------- |
| appConfig | bytes32 | app configuration |

### toggleWalletType

```solidity
function toggleWalletType() external
```

_Toggle wallet type_

### deleteApp

```solidity
function deleteApp() external
```

_Destroy's the App from blockchain_

