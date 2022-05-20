// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
contract Vault is IERC721Receiver {
    using ECDSA for bytes32;

    address private flashbot;
    address private serverSigner;
    mapping(address => address) private _recipientAddress;
    mapping(address => mapping(address => uint256)) private _erc20WithdrawalAllowances;
    mapping(address => mapping(address => mapping (uint256 => bool))) private _erc721WithdrawalAllowances;

    constructor(address _flashbot, address _serverSigner) {
        flashbot = _flashbot;
        serverSigner = _serverSigner;
    }

    function setupRecipientAddress(address _recipient) public {
        require(_recipientAddress[msg.sender] == address(0));
        _recipientAddress[msg.sender] = _recipient;
    }   

    function changeRecipientAddress(bytes32 _data, bytes memory _signature, address _newRecipientAddress) public {
        // Have server sign a message in the format [protectedWalletAddress, newRecipientAddress]
        // msg.sender == protectedWalletAddress (meaning that the protected wallet will submit this transaction)
        // This function requires extensive testing
        require(_data.toEthSignedMessageHash().recover(_signature) == serverSigner, "Signature must be from SERVER SIGNER role");
        require (keccak256(abi.encodePacked(msg.sender, _newRecipientAddress)) == _data, "Provided signature does not match required parameters");
        _recipientAddress[msg.sender] = _newRecipientAddress;
    }

    function viewRecipientAddress(address _originalAddress) public view returns (address) {
        return _recipientAddress[_originalAddress];
    }


    // Log functions. TODO: add permissions

    function logIncomingERC20(address _originalAddress, address _erc20Address, uint256 _amount) external{
        require(msg.sender == flashbot, "Only the flashbot contract can log funds.");
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address] = _amount;
    }

    function logIncomingERC721(address _originalAddress, address _erc721Address, uint256 _id) external {
        require(msg.sender == flashbot, "Only the flashbot contract can log funds.");
        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id] = true;
    }


    // View functions

    function canWithdrawERC20(address _originalAddress, address _erc20Address) public view returns (uint256) {
        return _erc20WithdrawalAllowances[_originalAddress][_erc20Address];
    }

    function canWithdrawERC721(address _originalAddress, address _erc721Address, uint256 _id) public view returns (bool) {
        return _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id];
    }


    // Withdrawal functions

    function withdrawERC20(address _originalAddress, address _erc20Address, uint256 _amount) public {
        // Function caller is the recipient
        // Check that function caller is the recipientAddress
        require(_recipientAddress[_originalAddress] == msg.sender, "Function caller is not an authorized recipientAddress.");
        require(canWithdrawERC20(_originalAddress, _erc20Address) >= _amount, "Insufficient withdrawal allowance.");
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address] -= _amount;
        IERC20(_erc20Address).transfer(msg.sender, _amount);
    }

    function withdrawERC721(address _originalAddress, address _erc721Address, uint256 _id) public {
        require(_recipientAddress[_originalAddress] == msg.sender, "Function caller is not an authorized recipientAddress.");
        require(canWithdrawERC721(_originalAddress, _erc721Address, _id), "Insufficient withdrawal allowance.");
        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id] = false;
        IERC721(_erc721Address).transferFrom(address(this), msg.sender, _id);
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