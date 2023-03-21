// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165, ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract PlatformNFT is Ownable, ERC721, IERC2981 {
    string private uri;
    uint256 private tokenId;
    address public feeReceiver;
    uint256 public royaltyFraction;

    constructor(address _feeReceiver, uint256 _royaltyFraction) ERC721("Mimo NFT", "MNFT") {
        require(_royaltyFraction <= 50, "invalid royalty fraction");
        feeReceiver = _feeReceiver;
        royaltyFraction = _royaltyFraction;
    }

    function mint(address receiver) external onlyOwner {
        _safeMint(receiver, tokenId++);
    }

    function setTokenURI(string memory _uri) external onlyOwner {
        uri = _uri;
    }

    function changeFeeReceiver(address _feeReceiver) external onlyOwner {
        require(feeReceiver != address(0), "");
        feeReceiver = _feeReceiver;
    }

    function changeRoyaltyFraction(uint256 _royaltyFraction) external onlyOwner {
        require(_royaltyFraction <= 50, "invalid royalty fraction");
        royaltyFraction = _royaltyFraction;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        require(_exists(_tokenId), "PlatformNFT: URI query for nonexistent token");
        return uri;
    }

    function royaltyInfo(
        uint256 /* tokenId */,
        uint256 salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        return (feeReceiver, salePrice * royaltyFraction / 100);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
