// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

// uint8 public Download = 1; //001
// uint8 public UpdateRuleSet = 2; //010
// uint8 public Delete = 4;//100
// uint8 public Transfer = 8;//1000

library RoleLib {
    function hasRole(uint8 role, uint8 testRole) public pure returns (bool) {
        return ((role & testRole) == testRole);
    }

    function grantRole(uint8 currRole, uint8 role) external pure returns (uint8) {
        require(!hasRole(currRole, role), "role_already_applied");
        return currRole | role;
    }

    function revokeRole(uint8 currRole, uint8 role) external pure returns (uint8) {
        require(hasRole(currRole, role), "role_not_found");
        return currRole ^ role;
    }
}
