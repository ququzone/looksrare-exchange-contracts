// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import {ILooksRareExchange} from "./interfaces/ILooksRareExchange.sol";
import {OrderTypes} from "./libraries/OrderTypes.sol";
import {CollectionType} from "./libraries/OrderEnums.sol";
import {BasicOrder} from "./libraries/OrderStructs.sol";
import {IProxy} from "./interfaces/IProxy.sol";
import {InvalidOrderLength} from "./libraries/SharedErrors.sol";
import {SignatureCheckerCalldata} from "./libraries/SignatureCheckerCalldata.sol";

abstract contract TokenTransferrer {
    function _transferTokenToRecipient(
        CollectionType collectionType,
        address collection,
        address recipient,
        uint256 tokenId,
        uint256 amount
    ) internal {
        if (collectionType == CollectionType.ERC721) {
            IERC721(collection).transferFrom(address(this), recipient, tokenId);
        } else if (collectionType == CollectionType.ERC1155) {
            IERC1155(collection).safeTransferFrom(address(this), recipient, tokenId, amount, "");
        }
    }
}

/**
 * @title LooksRareProxy
 * @notice This contract allows NFT sweepers to batch buy NFTs from LooksRare
 *         by passing high-level structs + low-level bytes as calldata.
 */
contract LooksRareBatch is TokenTransferrer {
    /**
     * @param makerAskPrice Maker ask price, which is not necessarily equal to the
     *                      taker bid price
     * @param minPercentageToAsk The maker's minimum % to receive from the sale
     * @param nonce The maker's nonce
     * @param strategy LooksRare execution strategy
     */
    struct OrderExtraData {
        uint256 makerAskPrice;
        uint256 minPercentageToAsk;
        uint256 nonce;
        address strategy;
    }

    ILooksRareExchange public immutable marketplace;

    /**
     * @param _marketplace LooksRareExchange's address
     */
    constructor(address _marketplace) {
        marketplace = ILooksRareExchange(_marketplace);
    }

    /**
     * @notice Execute LooksRare NFT sweeps in a single transaction
     * @dev extraData is not used
     * @param orders Orders to be executed by LooksRare
     * @param ordersExtraData Extra data for each order
     * @param recipient The address to receive the purchased NFTs
     * @param isAtomic Flag to enable atomic trades (all or nothing) or partial trades
     */
    function execute(
        BasicOrder[] calldata orders,
        bytes[] calldata ordersExtraData,
        bytes memory, /* extraData */
        address recipient,
        bool isAtomic
    ) external payable {
        uint256 ordersLength = orders.length;
        if (ordersLength == 0 || ordersLength != ordersExtraData.length) {
            revert InvalidOrderLength();
        }

        for (uint256 i; i < ordersLength; ) {
            BasicOrder calldata order = orders[i];

            OrderExtraData memory orderExtraData = abi.decode(ordersExtraData[i], (OrderExtraData));

            OrderTypes.MakerOrder memory makerAsk;
            {
                makerAsk.isOrderAsk = true;
                makerAsk.signer = order.signer;
                makerAsk.collection = order.collection;
                makerAsk.tokenId = order.tokenIds[0];
                makerAsk.price = orderExtraData.makerAskPrice;
                makerAsk.amount = order.amounts[0];
                makerAsk.strategy = orderExtraData.strategy;
                makerAsk.nonce = orderExtraData.nonce;
                makerAsk.minPercentageToAsk = orderExtraData.minPercentageToAsk;
                makerAsk.currency = order.currency;
                makerAsk.startTime = order.startTime;
                makerAsk.endTime = order.endTime;

                (bytes32 r, bytes32 s, uint8 v) = SignatureCheckerCalldata.splitSignature(order.signature);
                makerAsk.v = v;
                makerAsk.r = r;
                makerAsk.s = s;
            }

            OrderTypes.TakerOrder memory takerBid;
            {
                // No need to set isOrderAsk as its default value is false
                takerBid.taker = address(this);
                takerBid.price = order.price;
                takerBid.tokenId = makerAsk.tokenId;
                takerBid.minPercentageToAsk = makerAsk.minPercentageToAsk;
            }

            _executeSingleOrder(takerBid, makerAsk, recipient, order.collectionType, isAtomic);

            unchecked {
                ++i;
            }
        }
    }

    function _executeSingleOrder(
        OrderTypes.TakerOrder memory takerBid,
        OrderTypes.MakerOrder memory makerAsk,
        address recipient,
        CollectionType collectionType,
        bool isAtomic
    ) private {
        if (isAtomic) {
            marketplace.matchAskWithTakerBidUsingETHAndWETH{value: takerBid.price}(takerBid, makerAsk);
            _transferTokenToRecipient(
                collectionType,
                makerAsk.collection,
                recipient,
                makerAsk.tokenId,
                makerAsk.amount
            );
        } else {
            try marketplace.matchAskWithTakerBidUsingETHAndWETH{value: takerBid.price}(takerBid, makerAsk) {
                _transferTokenToRecipient(
                    collectionType,
                    makerAsk.collection,
                    recipient,
                    makerAsk.tokenId,
                    makerAsk.amount
                );
            } catch {}
        }
    }
}
