// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Flashbot is Ownable {
    address public vaultAddress;
    mapping(address => uint256) private _gasBalances;

    constructor(address _vaultAddress) {
        vaultAddress = _vaultAddress;
    } 

    // TODO: Add gas slashing
    function transferNFT(address nftAddress, address ownerAddress, uint256 nftId) public onlyOwner returns (bool) {
        // Add an approval check before executing or... maybe this just reverts?
        (bool success, bytes memory result) = address(nftAddress).call(
            abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", ownerAddress, vaultAddress, nftId)
        );
        return success;
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