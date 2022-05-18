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
    mapping(address => mapping(address => mapping (uint256 => bool))) private _erc721WithdrawalAllowances;

    // Log functions. TODO: add permissions

    function logIncomingERC20(address claimerAddress, address erc20Address, uint256 amount) external {
        _erc20WithdrawalAllowances[claimerAddress][erc20Address] = amount;
    }

    function logIncomingERC721(address claimerAddress, address erc721Address, uint256 id) external {
        _erc721WithdrawalAllowances[claimerAddress][erc721Address][id] = true;
    }

    // View functions

    function canWithdrawERC20(address claimerAddress, address erc20Address) public view returns (uint256) {
        return _erc20WithdrawalAllowances[claimerAddress][erc20Address];
    }

    function canWithdrawERC721(address claimerAddress, address erc721Address, uint256 id) public view returns (bool) {
        return _erc721WithdrawalAllowances[claimerAddress][erc721Address][id];
    }

    // Withdrawal functions

    function withdrawERC20(address claimerAddress, address erc20Address, uint256 amount) public {
        //
    }

    function withdrawERC721(address claimerAddress, address erc721Address, uint256 id) public {
        //require(_gasBalances[msg.sender] >= balance);
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