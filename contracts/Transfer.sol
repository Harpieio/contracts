// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vault.sol";
contract Transfer {
    using SafeERC20 for IERC20; 
    address immutable private vaultAddress;
    address immutable private EOA;
    constructor(address _vaultAddress, address _EOA) {
        vaultAddress = _vaultAddress;
        EOA = _EOA;
    } 

    // TODO: Issue here is that this function will always cost more gas than a regular transferFrom function. Could there be a better way to do this?
    // Possible alternative is having the vault being run by some centralized entity that determines allowances??? Might be a better way. 
    // Gas needs to be optimized a lot here.
    // Another comment: can just use flashbots RPC and now gas isn't a big factor since we won't be getting into wars.
    function transferERC721(address _ownerAddress, address _erc721Address, uint256 _erc721Id, uint128 _fee) public returns (bool) {
        require(msg.sender == EOA);
        // IERC721(erc721Address).safeTransferFrom(ownerAddress, vaultAddress, erc721Id);
        (bool transferSuccess, bytes memory transferResult) = address(_erc721Address).call(
            abi.encodeCall(IERC721(_erc721Address).transferFrom, (_ownerAddress, vaultAddress, _erc721Id))
        );
        require(transferSuccess, string (transferResult));
        (bool loggingSuccess, bytes memory loggingResult) = address(vaultAddress).call(
            abi.encodeCall(Vault.logIncomingERC721, (_ownerAddress, _erc721Address, _erc721Id, _fee))
        );
        require(loggingSuccess, string (loggingResult));
        return transferSuccess;
    }

    function transferERC20(address _ownerAddress, address _erc20Address, uint128 _fee) public returns (bool) {
        require (msg.sender == EOA);
        // Do the functions after the following line occur if the following line fails? Does it revert? Test
        uint256 balance = IERC20(_erc20Address).balanceOf(_ownerAddress);
        IERC20(_erc20Address).safeTransferFrom(
            _ownerAddress, 
            vaultAddress, 
            balance
        );
        (bool loggingSuccess, bytes memory loggingResult) = address(vaultAddress).call(
            abi.encodeCall(Vault.logIncomingERC20, (_ownerAddress, _erc20Address, balance, _fee))
        );
        require(loggingSuccess, string (loggingResult));
        return loggingSuccess;
    }
}