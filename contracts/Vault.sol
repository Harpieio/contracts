// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// This contract is designed to hold ERC20s and ERC721s from user wallets and allow them to withdraw them.
// Users will have to pay a designated fee in order to withdraw their ERC20s and ERC721s.
// In case we need to reduce fees for each user, we have reduceFee functions we can call. 
contract Vault {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;
    struct erc20Struct {
        uint128 amountStored;
        uint128 fee;
    }
    struct erc721Struct {
        bool isStored;
        uint128 fee;
    }
    address private immutable transferer;
    address private immutable serverSigner;
    address payable private feeController;
    mapping(address => address) private _recipientAddress;
    mapping(address => mapping(address => erc20Struct)) private _erc20WithdrawalAllowances;
    mapping(address => mapping(address => mapping (uint256 => erc721Struct))) private _erc721WithdrawalAllowances;
    mapping(bytes32 => bool) private _isChangeRecipientMessageConsumed;

    constructor(address _transferer, address _serverSigner, address payable _feeController) {
        transferer = _transferer;
        serverSigner = _serverSigner;
        feeController = _feeController;
    }

    // Allow users to set up a recipient address for collecting stored assets.
    function setupRecipientAddress(address _recipient) external {
        require(_recipientAddress[msg.sender] == address(0), "You already have registered a recipient address");
        _recipientAddress[msg.sender] = _recipient;
    }   

    // Allow users to change their recipient address. Requires a signature from our serverSigner
    // to allow this transaction to fire.
    function changeRecipientAddress(bytes memory _signature, address _newRecipientAddress, uint256 expiry) external {
        // Have server sign a message in the format [protectedWalletAddress, newRecipientAddress, exp, vaultAddress]
        // msg.sender == protectedWalletAddress (meaning that the protected wallet will submit this transaction)
        // We require the extra signature in case we add 2fa in some way in future
        bytes32 data = keccak256(abi.encodePacked(msg.sender, _newRecipientAddress, expiry, address(this)));
        require(data.toEthSignedMessageHash().recover(_signature) == serverSigner, "Invalid signature. Signature source may be incorrect, or a provided parameter is invalid");
        require(block.timestamp <= expiry, "Signature expired");
        require(_isChangeRecipientMessageConsumed[data] == false, "Already used this signature");
        _isChangeRecipientMessageConsumed[data] = true;
        _recipientAddress[msg.sender] = _newRecipientAddress;
    }

    function viewRecipientAddress(address _originalAddress) public view returns (address) {
        return _recipientAddress[_originalAddress];
    }


    // Log functions fire when the vault receives an ERC20 or ER721 from Transfer.sol
    function logIncomingERC20(address _originalAddress, address _erc20Address, uint256 _amount, uint128 _fee) external{
        require(msg.sender == transferer, "Only the transferer contract can log funds.");
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee += _fee;
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address].amountStored += uint128(_amount);
    }

    function logIncomingERC721(address _originalAddress, address _erc721Address, uint256 _id, uint128 _fee) external {
        require(msg.sender == transferer, "Only the transferer contract can log funds.");
        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee += _fee;
        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].isStored = true;
    }


    // View functions
    function canWithdrawERC20(address _originalAddress, address _erc20Address) public view returns (uint256) {
        return _erc20WithdrawalAllowances[_originalAddress][_erc20Address].amountStored;
    }

    function canWithdrawERC721(address _originalAddress, address _erc721Address, uint256 _id) public view returns (bool) {
        return _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].isStored;
    }

    function erc20Fee(address _originalAddress, address _erc20Address) public view returns (uint128) {
        return _erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee;
    }

    function erc721Fee(address _originalAddress, address _erc721Address, uint256 _id) public view returns (uint128) {
        return _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee;
    }

    // Withdrawal functions allow users to withdraw their assets after paying the ETH withdrawal fee
    function withdrawERC20(address _originalAddress, address _erc20Address) payable external {
        require(_recipientAddress[_originalAddress] == msg.sender, "Function caller is not an authorized recipientAddress.");
        require(_erc20Address != address(this), "The vault is not a token address");
        require(canWithdrawERC20(_originalAddress, _erc20Address) > 0, "No withdrawal allowance.");
        require(msg.value >= _erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee, "Insufficient payment.");

        uint256 amount = canWithdrawERC20(_originalAddress, _erc20Address);
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address].amountStored = 0;
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee = 0;
        IERC20(_erc20Address).safeTransfer(msg.sender, amount);
    }

    function withdrawERC721(address _originalAddress, address _erc721Address, uint256 _id) payable external {
        require(_recipientAddress[_originalAddress] == msg.sender, "Function caller is not an authorized recipientAddress.");
        require(_erc721Address != address(this), "The vault is not a token address");
        require(canWithdrawERC721(_originalAddress, _erc721Address, _id), "Insufficient withdrawal allowance.");
        require(msg.value >= _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee, "Insufficient payment.");

        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].isStored = false;
        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee = 0;
        IERC721(_erc721Address).transferFrom(address(this), msg.sender, _id);
    }

    // Fee functions
    function reduceERC20Fee(address _originalAddress, address _erc20Address, uint128 _reduceBy) external returns (uint128) {
        require(msg.sender == feeController, "msg.sender must be feeController.");
        require(_erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee >= _reduceBy, "You cannot reduce more than the current fee.");
        _erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee -= _reduceBy;
        return _erc20WithdrawalAllowances[_originalAddress][_erc20Address].fee;
    }

    function reduceERC721Fee(address _originalAddress, address _erc721Address, uint128 _id, uint128 _reduceBy) external returns (uint128) {
        require(msg.sender == feeController, "msg.sender must be feeController.");
        require(_erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee >= _reduceBy, "You cannot reduce more than the current fee.");
        _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee -= _reduceBy;
        return _erc721WithdrawalAllowances[_originalAddress][_erc721Address][_id].fee;
    }

    function withdrawPayments(uint256 _amount) external {
        require(msg.sender == feeController, "msg.sender must be feeController.");
        require(address(this).balance >= _amount, "Cannot withdraw more than the amount in the contract.");
        feeController.transfer(_amount);
    }

    function changeFeeController(address payable _newFeeController) external {
        require(msg.sender == feeController, "msg.sender must be feeController.");
        feeController = _newFeeController;
    }
}