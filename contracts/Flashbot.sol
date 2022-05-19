// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Flashbot is Ownable {
    address public vaultAddress;

    constructor(address _vaultAddress) {
        vaultAddress = _vaultAddress;
    } 

    // TODO: Issue here is that this function will always cost more gas than a regular transferFrom function. Could there be a better way to do this?
    // Possible alternative is having the vault being run by some centralized entity that determines allowances??? Might be a better way. 
    // Gas needs to be optimized a lot here.
    // Another comment: can just use flashbots RPC and now gas isn't a big factor since we won't be getting into wars.
    function transferERC721(address _ownerAddress, address _erc721Address, uint256 _erc721Id) public onlyOwner returns (bool) {
        // IERC721(erc721Address).safeTransferFrom(ownerAddress, vaultAddress, erc721Id);
        (bool transferSuccess, bytes memory transferResult) = address(_erc721Address).call(
            abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", _ownerAddress, vaultAddress, _erc721Id)
        );
        require(transferSuccess, string (transferResult));
        (bool loggingSuccess, bytes memory loggingResult) = address(vaultAddress).call(
            abi.encodeWithSignature("logIncomingERC721(address,address,uint256)", _ownerAddress, _erc721Address, _erc721Id)
        );
        require(loggingSuccess, string (loggingResult));
        return transferSuccess;
    }

    function transferERC20(address _ownerAddress, address _erc20Address, uint256 _amount) public onlyOwner returns (bool) {
        (bool transferSuccess, bytes memory transferResult) = address(_erc20Address).call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", _ownerAddress, vaultAddress, _amount)
        );
        require(transferSuccess, string (transferResult));
        (bool loggingSuccess, bytes memory loggingResult) = address(vaultAddress).call(
            abi.encodeWithSignature("logIncomingERC20(address,address,uint256)", _ownerAddress, _erc20Address, _amount)
        );
        require(loggingSuccess, string (loggingResult));
        return transferSuccess;
    }
}