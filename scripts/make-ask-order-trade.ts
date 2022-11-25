import { BigNumber } from "ethers";
import { ethers, getNamedAccounts, deployments } from "hardhat";
import { createMakerOrder, createTakerOrder } from "./helper/order-helper";

async function main() {
  const { execute, get, read } = deployments;
  const { deployer } = await getNamedAccounts();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const wallet = new ethers.Wallet(process.env.HOLDER_PRIVATE_KEY!, ethers.provider);

  const strategy = await get("StrategyStandardSaleForFixedPriceV1B");
  const exchange = await get("LooksRareExchange");
  const transferSelector = await read("LooksRareExchange", "transferSelectorNFT");

  const weth = "0xff5fae9fe685b90841275e32c348dc4426190db0";
  const collection = "0x8F477E965e0855351cf9A7CEa4E1c274225D42A1";
  const tokenId = BigNumber.from(0);
  const price = ethers.utils.parseEther("1");

  console.log(`fetch collection ${collection} transfer manager`);
  const transferManagerFactory = await ethers.getContractFactory("TransferSelectorNFT");
  const transferManager = await transferManagerFactory
    .attach(transferSelector)
    .checkTransferManagerForToken(collection);
  console.log(`collection ${collection} transfer manager is ${transferManager}`);

  console.log(`approve token ${tokenId} to TransferManager`);
  const token = await ethers.getContractAt("IERC721", collection);
  await token.connect(wallet).approve(transferManager, tokenId);

  console.log(`prepare ask order params`);
  const { chainId } = await ethers.provider.getNetwork();
  const now = new Date();
  const startTime = Math.floor(now.getTime() / 1000);
  const endTime = startTime + 86400; // one day

  const makerAskOrder = await createMakerOrder({
    isOrderAsk: true,
    signer: wallet.address,
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
    signerPrivateKey: process.env.HOLDER_PRIVATE_KEY!,
    verifyingContract: exchange.address,
    chainId: chainId.toString(),
  });

  const takerBidOrder = createTakerOrder({
    isOrderAsk: false,
    taker: deployer,
    price: price,
    tokenId: tokenId,
    minPercentageToAsk: BigNumber.from(9800),
    params: ethers.utils.defaultAbiCoder.encode([], []),
  });

  console.log(`Buy nft with taker bid`);
  const bidResult = await execute(
    "LooksRareExchange",
    {
      from: deployer,
      log: true,
      value: takerBidOrder.price,
      // gasLimit: 1000000,
      // gasPrice: "1000000000000",
    },
    "matchAskWithTakerBidUsingETHAndWETH",
    takerBidOrder,
    makerAskOrder
  );

  console.log(`bid transaction ${bidResult.transactionHash}`);
}

main()
  // eslint-disable-next-line no-process-exit
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
