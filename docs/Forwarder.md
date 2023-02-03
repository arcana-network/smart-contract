# Solidity API

## Forwarder

### factory

```solidity
contract IFactoryGatewayApp factory
```

_Factory Interface contract_

### _FORWARDTYPEHASH

```solidity
bytes32 _FORWARDTYPEHASH
```

### methodMappings

```solidity
mapping(string => struct Forwarder.functionSignature) methodMappings
```

### functionSignature

```solidity
struct functionSignature {
  bytes4 functionSelector;
  string typeHash;
}
```

### ForwardTransaction

```solidity
event ForwardTransaction(address from, address to, uint256 nonce, string method)
```

### onlyVallidArcanaContract

```solidity
modifier onlyVallidArcanaContract(address to)
```

_only app role modifier_

### setMethodMappings

```solidity
function setMethodMappings(string[] _method, struct Forwarder.functionSignature[] _funcSigns) external
```

### _nonces

```solidity
mapping(address => uint256) _nonces
```

### onlyGatewayNode

```solidity
modifier onlyGatewayNode()
```

_Only gateway node will have access_

### generateMainTypeHash

```solidity
function generateMainTypeHash(string method) internal view returns (bytes32)
```

### initialize

```solidity
function initialize(address _factory) public
```

_Act like an constructor for Initializable contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _factory | address | Factory contract address |

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

### getNonce

```solidity
function getNonce(address from) public view returns (uint256)
```

_Fetch nonce fom provided address_

### verify

```solidity
function verify(struct IForwarder.ForwardRequest req, bytes32 arcanaFunctionData, bytes signature) internal view returns (bool)
```

_verifies meta-transaction on the logic contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | struct IForwarder.ForwardRequest | ForwardRequest contains data required for meta transaction. `from`- signer, `to`- meta-txn request contract, `nonce`, `data`- encoded function data. |
| arcanaFunctionData | bytes32 |  |
| signature | bytes | Signature of the meta transaction request. |

### execute

```solidity
function execute(struct IForwarder.ForwardRequest req, bytes signature, bytes encodedCallData) public returns (bool, bytes)
```

_executess meta-transaction on the logic contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| req | struct IForwarder.ForwardRequest | ForwardRequest contains data required for meta transaction. `from`- signer, `to`- meta-txn request contract, `value`, `gas`, `nonce`, `data`- encoded function data. |
| signature | bytes | Signature of the meta transaction request. |
| encodedCallData | bytes | function calldata. |

