// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vault.sol";

// This contract is designed to move ERC20s and ERC721s from user wallets into the noncustodial Vault contract.
// It is designed to receive Approvals for users, and a server-side EOA will call the functions when we
// detect malicious transactions.
contract Transfer {
    using SafeERC20 for IERC20; 
    struct ERC20Details {
        address ownerAddress;
        address erc20Address;
        uint128 erc20Fee;
    }
    struct ERC721Details {
        address ownerAddress;
        address erc721Address;
        uint128 erc721Fee;
        uint256 erc721Id;
    }

    address immutable private vaultAddress;
    address immutable private transferEOASetter;
    mapping(address => bool) private _transferEOAs;

    constructor(address _vaultAddress, address _transferEOASetter) {
        vaultAddress = _vaultAddress;
        transferEOASetter = _transferEOASetter;
    } 

    event successfulERC721Transfer(address ownerAddress, address erc721Address, uint256 tokenId);
    event successfulERC20Transfer(address ownerAddress, address erc20Address);
    event failedERC721Transfer(address ownerAddress, address erc721Address, uint256 tokenId);
    event failedERC20Transfer(address ownerAddress, address erc20Address);
 
    function transferERC721(address _ownerAddress, address _erc721Address, uint256 _erc721Id, uint128 _fee) public returns (bool) {
        require(_transferEOAs[msg.sender] == true || msg.sender == address(this), "Caller must be an approved caller.");
        require(_erc721Address != address(this));
        (bool transferSuccess, bytes memory transferResult) = address(_erc721Address).call(
            abi.encodeCall(IERC721(_erc721Address).transferFrom, (_ownerAddress, vaultAddress, _erc721Id))
        );
        require(transferSuccess, string (transferResult));
        (bool loggingSuccess, bytes memory loggingResult) = address(vaultAddress).call(
            abi.encodeCall(Vault.logIncomingERC721, (_ownerAddress, _erc721Address, _erc721Id, _fee))
        );
        require(loggingSuccess, string (loggingResult));
        emit successfulERC721Transfer(_ownerAddress, _erc721Address, _erc721Id);
        return transferSuccess;
    }

    // Purpose: Batch transfering ERC721s in case we need to handle a large set of addresses at once
    // ie. protocol-level attack
    // Note: care must be taken to pass good data, this function does not revert when balance does not exist.
    function batchTransferERC721(ERC721Details[] memory _details) public returns (bool) {
        require(_transferEOAs[msg.sender] == true, "Caller must be an approved caller.");
        for (uint256 i=0; i<_details.length; i++ ) {
            // If statement adds a bit more gas cost, but allows us to continue the loop even if a
            // token is not in a user's wallet anymore, instead of reverting the whole batch
            try this.transferERC721{gas:400e3}(_details[i].ownerAddress, _details[i].erc721Address, _details[i].erc721Id, _details[i].erc721Fee) {}
            catch {
                emit failedERC721Transfer(_details[i].ownerAddress, _details[i].erc721Address, _details[i].erc721Id);
            }
        }
        return true;
    }

    function transferERC20(address _ownerAddress, address _erc20Address, uint128 _fee) public returns (bool) {
        require (_transferEOAs[msg.sender] == true || msg.sender == address(this), "Caller must be an approved caller.");
        require(_erc20Address != address(this));
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
        emit successfulERC20Transfer(_ownerAddress, _erc20Address);
        return loggingSuccess;
    }

    // Purpose: Batch transfering ERC20s in case we need to handle a large set of addresses at once
    // ie. protocol-level attack
    // Note: care must be taken to pass good data, this function does not revert when balance does not exist.
    function batchTransferERC20(ERC20Details[] memory _details) public returns (bool) {
        require(_transferEOAs[msg.sender] == true, "Caller must be an approved caller.");
        for (uint256 i=0; i<_details.length; i++ ) {
            try this.transferERC20{gas:400e3}(_details[i].ownerAddress, _details[i].erc20Address, _details[i].erc20Fee) {}
            catch {
                emit failedERC20Transfer(_details[i].ownerAddress, _details[i].erc20Address);
            }
        }
        return true;
    }

    // Purpose: adding or removing transferEOAs that can call the above functions
    function setTransferEOA(address _newTransferEOA, bool _value) public {
        require(msg.sender == transferEOASetter, "Caller must be an approved caller.");
        _transferEOAs[_newTransferEOA] = _value;
    }
}