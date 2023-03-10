# Solidity API

## UUPSUpgradeable

\_An upgradeability mechanism designed for UUPS proxies. The functions included here can perform an upgrade of an
{ERC1967Proxy}, when this contract is set as the implementation behind such a proxy.

A security mechanism ensures that an upgrade does not turn off upgradeability accidentally, although this risk is
reinstated if the upgrade retains upgradeability but removes the security mechanism, e.g. by replacing
`UUPSUpgradeable` with a custom implementation of upgrades.

The {\_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.

\_Available since v4.1.\_\_

### \_\_UUPSUpgradeable_init

```solidity
function __UUPSUpgradeable_init() internal
```

### \_\_UUPSUpgradeable_init_unchained

```solidity
function __UUPSUpgradeable_init_unchained() internal
```

### \_\_self

```solidity
address __self
```

### onlyProxy

```solidity
modifier onlyProxy()
```

_Check that the execution is being performed through a delegatecall call and that the execution context is
a proxy contract with an implementation (as defined in ERC1967) pointing to self. This should only be the case
for UUPS and transparent proxies that are using the current contract as their implementation. Execution of a
function through ERC1167 minimal proxies (clones) would not normally pass this test, but is not guaranteed to
fail._

### upgradeTo

```solidity
function upgradeTo(address newImplementation) external virtual
```

\_Upgrade the implementation of the proxy to `newImplementation`.

Calls {\_authorizeUpgrade}.

Emits an {Upgraded} event.\_

### upgradeToAndCall

```solidity
function upgradeToAndCall(address newImplementation, bytes data) external payable virtual
```

\_Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call
encoded in `data`.

Calls {\_authorizeUpgrade}.

Emits an {Upgraded} event.\_

### \_authorizeUpgrade

```solidity
function _authorizeUpgrade(address newImplementation) internal virtual
```

\_Function that should revert when `msg.sender` is not authorized to upgrade the contract. Called by
{upgradeTo} and {upgradeToAndCall}.

Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.

````solidity
function _authorizeUpgrade(address) internal override onlyOwner {}
```_

### getImplementation

```solidity
function getImplementation() external view returns (address)
````

### \_\_gap

```solidity
uint256[50] __gap
```
