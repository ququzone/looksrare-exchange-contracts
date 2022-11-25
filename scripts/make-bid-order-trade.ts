import { BigNumber } from "ethers";
import { ethers, getNamedAccounts, deployments } from "hardhat";
import { createMakerOrder, createTakerOrder } from "./helper/order-helper";

async function main() {
  const { execute, get, read } = deployments;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const holderKey = process.env.HOLDER_PRIVATE_KEY!;
  const holder = new ethers.Wallet(holderKey, ethers.provider);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const buyerKey = process.env.PRIVATE_KEY!;
  const buyer = new ethers.Wallet(buyerKey, ethers.provider);

  const strategy = await get("StrategyStandardSaleForFixedPriceV1B");
  const exchange = await get("LooksRareExchange");
  const transferSelector = await read("LooksRareExchange", "transferSelectorNFT");

  const weth = "0xff5fae9fe685b90841275e32c348dc4426190db0";
  const collection = "0x8F477E965e0855351cf9A7CEa4E1c274225D42A1";
  const tokenId = BigNumber.from(3);
  const price = ethers.utils.parseEther("1");

  console.log(`Swap WETH and approve to nft exchange`);
  const WETH = await ethers.getContractAt("IWETH", weth);
  await WETH.connect(buyer).deposit({ value: price });
  const ERC20 = await ethers.getContractAt("IERC20", weth);
  await ERC20.connect(buyer).approve(exchange.address, price);

  console.log(`Fetch collection ${collection} transfer manager`);
  const transferManagerFactory = await ethers.getContractFactory("TransferSelectorNFT");
  const transferManager = await transferManagerFactory
    .attach(transferSelector)
    .checkTransferManagerForToken(collection);
  console.log(`Collection ${collection} transfer manager is ${transferManager}`);

  console.log(`prepare ask order params`);
  const { chainId } = await ethers.provider.getNetwork();
  const now = new Date();
  const startTime = Math.floor(now.getTime() / 1000);
  const endTime = startTime + 86400; // one day

  const makerBidOrder = await createMakerOrder({
    isOrderAsk: false,
    signer: buyer.address,
    collection: collection,
    price: price,
    tokenId: tokenId,
    amount: BigNumber.from(1),
    strategy: strategy.address,
    currency: weth,
    nonce: BigNumber.from(0), // nonce
    startTime: BigNumber.from(startTime),
    endTime: BigNumber.from(endTime),
    minPercentageToAsk: BigNumber.from(9800),
    params: ethers.utils.defaultAbiCoder.encode([], []),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    signerPrivateKey: buyerKey,
    verifyingContract: exchange.address,
    chainId: chainId.toString(),
  });

  const takerAskOrder = createTakerOrder({
    isOrderAsk: true,
    taker: holder.address,
    price: price,
    tokenId: tokenId,
    minPercentageToAsk: BigNumber.from(9800),
    params: ethers.utils.defaultAbiCoder.encode([], []),
  });

  console.log(`Approve token ${tokenId} to TransferManager`);
  const token = await ethers.getContractAt("IERC721", collection);
  await token.connect(holder).approve(transferManager, tokenId);

  console.log(`Sell nft with taker ask`);
  const exchangeIns = await ethers.getContractAt("LooksRareExchange", exchange.address);
  const bidResult = await exchangeIns.connect(holder).matchBidWithTakerAsk(takerAskOrder, makerBidOrder);

  console.log(`bid transaction ${bidResult.hash}`);
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
