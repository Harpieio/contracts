// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Flashbot is Ownable {
    address public vaultAddress;
    mapping(address => uint256) private _gasBalances;

    constructor(address _vaultAddress) {
        vaultAddress = _vaultAddress;
    } 

    // TODO: Issue here is that this function will always cost more gas than a regular transferFrom function. Could there be a better way to do this?
    // Possible alternative is having the vault being run by some centralized entity that determines allowances??? Might be a better way. 
    // Gas needs to be optimized a lot here.
    function transferERC721(address ownerAddress, address erc721Address, uint256 erc721Id) public onlyOwner returns (bool) {
        // IERC721(erc721Address).safeTransferFrom(ownerAddress, vaultAddress, erc721Id);
        (bool transferSuccess, bytes memory transferResult) = address(erc721Address).call(
            abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", ownerAddress, vaultAddress, erc721Id)
        );
        require(transferSuccess, string (transferResult));
        (bool loggingSuccess, bytes memory loggingResult) = address(vaultAddress).call(
            abi.encodeWithSignature("logIncomingERC721(address,address,uint256)", ownerAddress, erc721Address, erc721Id)
        );
        require(loggingSuccess, string (loggingResult));
        return transferSuccess;
    }

    function depositGas() payable public {
        _gasBalances[msg.sender] += msg.value;
    }

    function depositGasOnBehalfOf(address onBehalfOf) payable public {
        _gasBalances[onBehalfOf] += msg.value;
    }

    function withdrawGas(uint256 balance) public {
        require(_gasBalances[msg.sender] >= balance);
        _gasBalances[msg.sender] -= balance;
        payable(msg.sender).transfer(balance);
    }

    function getGasBalance() public view returns (uint256) {
        return _gasBalances[msg.sender];
    }
}