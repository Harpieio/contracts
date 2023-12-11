// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20, ERC20Permit} from "@soliditylabs/erc20-permit/contracts/ERC20Permit.sol";

contract PermitToken is ERC20Permit {
    constructor (uint256 initialSupply) ERC20("ERC20Permit-Token", "EPT") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }
}