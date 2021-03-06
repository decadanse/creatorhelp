// SPDX-License-Identifier: MIT

import "./ERC721.sol";
import "./ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

pragma solidity >=0.7.0 <0.9.0;

contract NFT is ERC721Enumerable, Ownable {

//----
    using Counters for Counters.Counter;
    Counters.Counter internal _counter;
//----


    using Strings for uint256;

    uint256 public cost = 1 ether;
    uint256 public maxSupply = 20;

    string baseURI;
    string public baseExtension = ".json";

    address public artist;
    uint256 public royalityFee;


    bool public transferable_;

    // Events
    event Sale(address from, address to, uint256 value);

    event ToggleTransferable(bool transferable);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        uint256 _royalityFee,
        address _artist,
        bool _transferable
    ) ERC721(_name, _symbol) {
        setBaseURI(_initBaseURI);
        royalityFee = _royalityFee;
        artist = _artist;
        transferable_ = _transferable;
    }



    // External functions
    function toggleTransferable() external onlyOwner returns (bool) {
        if (transferable_) {
            transferable_ = false;
        } else {
            transferable_ = true;
        }
        emit ToggleTransferable(transferable_);
        return transferable_;
    }


    // Public functions
    function transferable() public view returns (bool) {
        return transferable_;
    }

    function mint() public payable {
        uint256 supply = totalSupply();
        require(supply <= maxSupply);

        if (msg.sender != owner()) {
            require(msg.value >= cost);

            // Pay royality to artist, and remaining to deployer of contract

            uint256 royality = (msg.value * royalityFee) / 100;
            _payRoyality(royality);

            (bool success2, ) = payable(owner()).call{
                value: (msg.value - royality)
            }("");
            require(success2);
        }

        _safeMint(msg.sender, supply + 1);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                )
                : "";
    }


//___________________________________________________
    function nextId() public view returns (uint256) {
        return _counter.current();
    }


    // Added isTransferable only
    function approve(address to, uint256 tokenId)
        public
        override
        isTransferable
    {
        //_isApprovedOrOwner(_msgSender(), tokenId),
        address owner = ERC721.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }
//___________________________________________________


    // Added isTransferable only
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override isTransferable{
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        if (msg.value > 0) {
            uint256 royality = (msg.value * royalityFee) / 100;
            _payRoyality(royality);

            (bool success2, ) = payable(from).call{value: msg.value - royality}(
                ""
            );
            require(success2);

            emit Sale(from, to, msg.value);
        }

        _transfer(from, to, tokenId);
    }

    // Added isTransferable only
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override isTransferable{
        if (msg.value > 0) {
            uint256 royality = (msg.value * royalityFee) / 100;
            _payRoyality(royality);

            (bool success2, ) = payable(from).call{value: msg.value - royality}(
                ""
            );
            require(success2);

            emit Sale(from, to, msg.value);
        }

        safeTransferFrom(from, to, tokenId, "");
    }

    // Added isTransferable only
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public payable override isTransferable {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        if (msg.value > 0) {
            uint256 royality = (msg.value * royalityFee) / 100;
            _payRoyality(royality);

            (bool success2, ) = payable(from).call{value: msg.value - royality}(
                ""
            );
            require(success2);

            emit Sale(from, to, msg.value);
        }

        _safeTransfer(from, to, tokenId, _data);
    }

    // Internal functions
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function _payRoyality(uint256 _royalityFee) internal {
        (bool success1, ) = payable(artist).call{value: _royalityFee}("");
        require(success1);
    }

    // Owner functions
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setRoyalityFee(uint256 _royalityFee) public onlyOwner {
        royalityFee = _royalityFee;
    }

    // Modifiers
    modifier isTransferable() {
        require(transferable() == true, "Memberships: not transferable");
        _;
    }
}
