# Solidity API

## ArcanaNFTHandler

_Handles NFT and DID data_

### factory

```solidity
address factory
```

### DID

```solidity
contract IDID DID
```

### ADMIN

```solidity
bytes32 ADMIN
```

### VALIDATOR_ROLE

```solidity
bytes32 VALIDATOR_ROLE
```

### APP_ROLE

```solidity
bytes32 APP_ROLE
```

### NFT

```solidity
struct NFT {
  address nftContract;
  uint256 tokenId;
  uint256 chainId;
}

```

### initialize

```solidity
function initialize(address _factory, address _did) public
```

_Act like an constructor for Initializable contract_

| Name      | Type    | Description              |
| --------- | ------- | ------------------------ |
| \_factory | address | factory contract address |
| \_did     | address | DID contract address     |

### \_authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

### nfts

```solidity
mapping(uint256 => mapping(address => mapping(uint256 => address))) nfts
```

_Mapping, NFT owners info chainId -> nftcontract -> token id -> owner address_

### nftToDid

```solidity
mapping(uint256 => mapping(address => mapping(uint256 => bytes32))) nftToDid
```

_Mapping, NFT to did, chainId -> NFTContractAddress -> tokenId -> did_

### \_didToNFT

```solidity
mapping(bytes32 => struct ArcanaNFTHandler.NFT) _didToNFT
```

_Mapping DID -> NFT Token_

### NFTAdded

```solidity
event NFTAdded(address owner, uint256 tokenId, address nftContract)
```

_Emits after NFT data is added_

### OwnerChanged

```solidity
event OwnerChanged(bytes32 did, address nftContract, uint256 tokenId, address owner)
```

_Emits changeOwner details_

### updateNFT

```solidity
function updateNFT(uint256 _chainId, address _nftContract, uint256 _tokenId, address _owner) external
```

_This function will be called by bridge to add NFT_

| Name          | Type    | Description                             |
| ------------- | ------- | --------------------------------------- |
| \_chainId     | uint256 | ChainId of the NFT contract deployed on |
| \_nftContract | address | NFT contract/collection address         |
| \_tokenId     | uint256 | NFT token ID                            |
| \_owner       | address | Address of the NFT owner                |

### didToNFT

```solidity
function didToNFT(bytes32 _did) external view returns (struct ArcanaNFTHandler.NFT)
```

_NFT linked with the DID_

| Name  | Type    | Description     |
| ----- | ------- | --------------- |
| \_did | bytes32 | DID of the file |

| Name | Type                        | Description                                                     |
| ---- | --------------------------- | --------------------------------------------------------------- |
| [0]  | struct ArcanaNFTHandler.NFT | NFT NFT details i.e, chainId, tokenId, NFTContractAddress, did. |

### isNFT

```solidity
function isNFT(bytes32 did) public view returns (bool)
```

_checks if did is linked to NFT_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0]  | bool | bool        |

### linkNFT

```solidity
function linkNFT(bytes32 _did, uint256 _tokenId, address _nftContract, uint256 _chainId) external
```

_Links NFT with DID_

| Name          | Type    | Description                             |
| ------------- | ------- | --------------------------------------- |
| \_did         | bytes32 | DID of the file                         |
| \_tokenId     | uint256 | NFT token ID                            |
| \_nftContract | address | NFT contract/collection address         |
| \_chainId     | uint256 | ChainId of the NFT contract deployed on |

### addValidator

```solidity
function addValidator(address _validator) external
```

_Add a new validator. Bridge will be given the validator role._

| Name        | Type    | Description                  |
| ----------- | ------- | ---------------------------- |
| \_validator | address | address of the bridge signer |

### removeValidator

```solidity
function removeValidator(address _validator) external
```

_remove validator role._

| Name        | Type    | Description                  |
| ----------- | ------- | ---------------------------- |
| \_validator | address | address of the bridge signer |

### addApp

```solidity
function addApp(address _app) external
```

_Sets app role_

| Name  | Type    | Description        |
| ----- | ------- | ------------------ |
| \_app | address | address of the app |
