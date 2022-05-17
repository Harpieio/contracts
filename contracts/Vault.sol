// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is IERC721Receiver, Ownable {
    uint public contractFee;
    mapping(address => uint256) private _recipientAddress;
    mapping(address => mapping(address => uint256)) private _erc20WithdrawalAllowances;
    mapping(address => mapping(address => uint256[])) private _erc721WithdrawalAllowances;

    function getERC721Balance(address claimerAddress, address erc721Address) public view returns (uint256[] memory){
        return _erc721WithdrawalAllowances[claimerAddress][erc721Address];
    }

    // Add permissions later
    function logIncomingERC721(address claimerAddress, address erc721Address, uint256 id) external {
        _erc721WithdrawalAllowances[claimerAddress][erc721Address].push(id);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}