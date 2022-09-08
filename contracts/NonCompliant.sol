// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NonCompliant is ERC20 {
    constructor() ERC20("DevToken", "DVT"){
        _mint(msg.sender,1000*10**18);
    }
}