# Solidity API

## ERC2771ContextUpgradeable

_Context variant with ERC2771 support._

### _trustedForwarder

```solidity
address _trustedForwarder
```

### __ERC2771Context_init

```solidity
function __ERC2771Context_init(address trustedForwarder) internal
```

### __ERC2771Context_init_unchained

```solidity
function __ERC2771Context_init_unchained(address trustedForwarder) internal
```

### isTrustedForwarder

```solidity
function isTrustedForwarder(address forwarder) public view virtual returns (bool)
```

### __gap

```solidity
uint256[49] __gap
```

