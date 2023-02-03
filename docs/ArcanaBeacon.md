# Solidity API

## ArcanaBeacon

### blueprint

```solidity
address blueprint
```

### beaconInstance

```solidity
contract UpgradeableBeacon beaconInstance
```

### constructor

```solidity
constructor(address _initPrint) public
```

### update

```solidity
function update(address _newPrint) external
```

_updates to a new implementation_

### implementation

```solidity
function implementation() public view returns (address _blueprint)
```

| Name | Type | Description |
| ---- | ---- | ----------- |
| _blueprint | address | current implemtation address |

