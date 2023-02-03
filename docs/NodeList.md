# Solidity API

## NodeList

### currentEpoch

```solidity
uint256 currentEpoch
```

### Details

```solidity
struct Details {
  string declaredIp;
  uint256 position;
  uint256 pubKx;
  uint256 pubKy;
  string tmP2PListenAddress;
  string p2pListenAddress;
}
```

### Epoch

```solidity
struct Epoch {
  uint256 id;
  uint256 n;
  uint256 k;
  uint256 t;
  address[] nodeList;
  uint256 prevEpoch;
  uint256 nextEpoch;
}
```

### NodeListed

```solidity
event NodeListed(address publicKey, uint256 epoch, uint256 position)
```

### EpochChanged

```solidity
event EpochChanged(uint256 oldEpoch, uint256 newEpoch)
```

### whitelist

```solidity
mapping(uint256 => mapping(address => bool)) whitelist
```

### epochInfo

```solidity
mapping(uint256 => struct NodeList.Epoch) epochInfo
```

### nodeDetails

```solidity
mapping(address => struct NodeList.Details) nodeDetails
```

### pssStatus

```solidity
mapping(uint256 => mapping(uint256 => uint256)) pssStatus
```

### epochValid

```solidity
modifier epochValid(uint256 epoch)
```

### epochCreated

```solidity
modifier epochCreated(uint256 epoch)
```

### whitelisted

```solidity
modifier whitelisted(uint256 epoch)
```

### initialize

```solidity
function initialize(uint256 _epoch) public
```

### setCurrentEpoch

```solidity
function setCurrentEpoch(uint256 _newEpoch) external
```

### listNode

```solidity
function listNode(uint256 epoch, string declaredIp, uint256 pubKx, uint256 pubKy, string tmP2PListenAddress, string p2pListenAddress) external
```

### getNodes

```solidity
function getNodes(uint256 epoch) external view returns (address[])
```

### getNodeDetails

```solidity
function getNodeDetails(address nodeAddress) external view returns (string declaredIp, uint256 position, string tmP2PListenAddress, string p2pListenAddress)
```

### getPssStatus

```solidity
function getPssStatus(uint256 oldEpoch, uint256 newEpoch) external view returns (uint256)
```

### getEpochInfo

```solidity
function getEpochInfo(uint256 epoch) external view returns (uint256 id, uint256 n, uint256 k, uint256 t, address[] nodeList, uint256 prevEpoch, uint256 nextEpoch)
```

### updatePssStatus

```solidity
function updatePssStatus(uint256 oldEpoch, uint256 newEpoch, uint256 status) public
```

### updateWhitelist

```solidity
function updateWhitelist(uint256 epoch, address nodeAddress, bool allowed) public
```

### updateEpoch

```solidity
function updateEpoch(uint256 epoch, uint256 n, uint256 k, uint256 t, address[] nodeList, uint256 prevEpoch, uint256 nextEpoch) public
```

### isWhitelisted

```solidity
function isWhitelisted(uint256 epoch, address nodeAddress) public view returns (bool)
```

### nodeRegistered

```solidity
function nodeRegistered(uint256 epoch, address nodeAddress) public view returns (bool)
```

### clearAllEpoch

```solidity
function clearAllEpoch() public
```

### getCurrentEpochDetails

```solidity
function getCurrentEpochDetails() external view returns (struct NodeList.Details[] nodes)
```

