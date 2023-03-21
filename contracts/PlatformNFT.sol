// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PlatformNFT is Ownable, ERC721 {
    string private _uri;
    uint256 private _tokenId;

    constructor() ERC721("Mimo NFT", "MNFT") {
    }

    function mint(address receiver) external onlyOwner {
        _safeMint(receiver, _tokenId++);
    }

    function setTokenURI(string memory uri) external onlyOwner {
        _uri = uri;
    }

    function tokenURI(uint256 tokenId) override public view returns (string memory) {
        require(_exists(tokenId), "PlatformNFT: URI query for nonexistent token");
        return _uri;
    }
}
