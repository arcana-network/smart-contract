# Solidity API

## Factory

_Create New beacon proxy for each new app_

### app

```solidity
mapping(address => address) app
```

_App contract => owner of the app_

### voteUserRegistration

```solidity
mapping(address => mapping(address => mapping(address => bool))) voteUserRegistration
```

_app =>  user =>  node => vote_

### totalVotes

```solidity
mapping(address => mapping(address => uint256)) totalVotes
```

_app => user => vote_

### onlyDKGAddress

```solidity
mapping(address => bool) onlyDKGAddress
```

_app => bool (if true only allow Arcana created wallets to make transactions)_

### defaultStorage

```solidity
uint256 defaultStorage
```

_Default storage limit for apps_

### defaultBandwidth

```solidity
uint256 defaultBandwidth
```

_Default bandwidth limit for apps_

### NewApp

```solidity
event NewApp(address owner, address appProxy)
```

_Emits new app details_

### isNode

```solidity
mapping(address => bool) isNode
```

### _gateway

```solidity
mapping(address => struct IFactoryGatewayApp.PublicKey) _gateway
```

### arcanaBeacon

```solidity
contract ArcanaBeacon arcanaBeacon
```

_Arcana beacon contract instance_

### did

```solidity
address did
```

_DID contract address_

### initialize

```solidity
function initialize(address initBluePrint) public
```

_Act like an constructor for Initializable contract
Creates new beacon contract with initial logic implementation_

| Name | Type | Description |
| ---- | ---- | ----------- |
| initBluePrint | address | Arcana logic contract address |

### setDID

```solidity
function setDID(address _did) public
```

_sets DID address_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _did | address | DID contract address |

### gateway

```solidity
function gateway(address _nodeAddress) external view returns (struct IFactoryGatewayApp.PublicKey)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _nodeAddress | address | gateway node address |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IFactoryGatewayApp.PublicKey | publicKey of the gateway node |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

### modifyGateway

```solidity
function modifyGateway(address node, bytes32 x, bytes32 y) external
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| node | address | gateway node address |
| x | bytes32 | x co-ordinate of public key |
| y | bytes32 | y co-ordinate of public key |

### gatewayNodeOrOwner

```solidity
modifier gatewayNodeOrOwner()
```

### createNewApp

```solidity
function createNewApp(address _owner, uint256 _store, uint256 _bandwidth, address _relayer, bool _onlyDKGAddress, bool _aggregateLogin, bytes32 _appConfig) external
```

_Create new app using beacon proxy_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | Owner of the app |
| _store | uint256 | Storage limit of the app |
| _bandwidth | uint256 | Badnwidth limit of the app |
| _relayer | address | Forwarder contract address |
| _onlyDKGAddress | bool | Only allow wallets created from Arcana DKG to make transactions |
| _aggregateLogin | bool | If true, then DKG will generate same key for all OAuth providers |
| _appConfig | bytes32 | App configuration |

### modifyNode

```solidity
function modifyNode(address _node, bool _value) public
```

_Add or remove nodes in the network_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _node | address | address of the node that is being modified |
| _value | bool | if True node is added to the network else node is not part of the network |

### setDefaultLimit

```solidity
function setDefaultLimit(uint256 _storage, uint256 _bandwidth) external
```

_Set default storage and bandwidth limits_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _storage | uint256 | Default sotrage limit |
| _bandwidth | uint256 | Default bandwidth |

### setAppLevelLimit

```solidity
function setAppLevelLimit(address _app, uint256 _store, uint256 _bandwidth) public
```

_Set app level storage and bandwidth limits_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _app | address | Address of the app |
| _store | uint256 | App level storage limit |
| _bandwidth | uint256 | App level bandwidth |

### toggleWalletType

```solidity
function toggleWalletType(address _app) external
```

_Toggle wallet type_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _app | address | Address of the app |

### getBeacon

```solidity
function getBeacon() external view returns (address _arcanaBeacon)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arcanaBeacon | address | Address of Arcana Beacon contract |

### getImplementation

```solidity
function getImplementation() external view returns (address _implementation)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _implementation | address | Get the implementaiton contract address |

