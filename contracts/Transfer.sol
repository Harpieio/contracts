// contracts/delegator.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vault.sol";
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
    struct ERC721DetailsPartial {
        uint256 erc721Id;
        uint128 erc721Fee;
    }

    address immutable private vaultAddress;
    address immutable private EOA;
    constructor(address _vaultAddress, address _EOA) {
        vaultAddress = _vaultAddress;
        EOA = _EOA;
    } 
 
    function transferERC721(address _ownerAddress, address _erc721Address, uint256 _erc721Id, uint128 _fee) public returns (bool) {
        require(msg.sender == EOA);
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

    // Purpose: Batch transfering ERC721s in case we need to handle a large set of addresses at once
    // ie. protocol-level attack
    // Note: care must be taken to pass good data, this function does not revert. Max of 2^8 entries for safety.
    // Note 2: less gas efficient, use batchTransferERC721Restrictive when possible
    function batchTransferERC721(ERC721Details[] memory _details) public returns (bool) {
        require(msg.sender == EOA);
        for (uint8 i=0; i<_details.length; i++ ) {
            // If statement adds a bit more gas cost, but allows us to continue the loop even if a
            // token is not in a user's wallet anymore, instead of reverting the whole batch
            if (IERC721(_details[i].erc721Address).ownerOf(_details[i].erc721Id) == _details[i].ownerAddress) {
                transferERC721(_details[i].ownerAddress, _details[i].erc721Address, _details[i].erc721Id, _details[i].erc721Fee);
            }
        }
        return true;
    }

    // Purpose: Batch transfering ERC721s in case we need to handle a large set of nftIds from the same address at once
    // ie. handling ApprovalForAll phishing
    // Note: care must be taken to pass good data, this function does not revert. Max of 2^8 entries for safety.
    function batchTransferERC721Restrictive(address _ownerAddress, address _erc721Address, ERC721DetailsPartial[] memory _details) public returns (bool) {
        require(msg.sender == EOA);
        for (uint8 i=0; i<_details.length; i++ ) {
            // If statement adds a bit more gas cost, but allows us to continue the loop even if a
            // token is not in a user's wallet anymore, instead of reverting the whole batch
            if (IERC721(_erc721Address).ownerOf(_details[i].erc721Id) == _ownerAddress) {
                transferERC721(_ownerAddress, _erc721Address, _details[i].erc721Id, _details[i].erc721Fee);
            }
        }
        return true;
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

    // Purpose: Batch transfering ERC20s in case we need to handle a large set of addresses at once
    // ie. protocol-level attack
    // Note: care must be taken to pass good data, this function does not revert. Max of 2^8 entries for safety.
    function batchTransferERC20(ERC20Details[] memory _details) public returns (bool) {
        require(msg.sender == EOA);
        for (uint8 i=0; i<_details.length; i++ ) {
            transferERC20(_details[i].ownerAddress, _details[i].erc20Address, _details[i].erc20Fee);
        }
        return true;
    }
}