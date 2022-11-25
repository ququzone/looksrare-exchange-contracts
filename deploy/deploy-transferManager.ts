import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const exchange = await get("LooksRareExchange");

  // deploy TransferManagerERC721
  const transferManagerERC721 = await deploy("TransferManagerERC721", {
    from: deployer,
    log: true,
    args: [exchange.address],
  });

  // TransferManagerNonCompliantERC721
  await deploy("TransferManagerNonCompliantERC721", {
    from: deployer,
    log: true,
    args: [exchange.address],
  });

  // TransferManagerERC1155
  const transferManagerERC1155 = await deploy("TransferManagerERC1155", {
    from: deployer,
    log: true,
    args: [exchange.address],
  });

  // deploy TransferSelectorNFT
  await deploy("TransferSelectorNFT", {
    from: deployer,
    log: true,
    args: [transferManagerERC721.address, transferManagerERC1155.address],
  });
};

export default deployFunction;
deployFunction.tags = [`all`, `transfer-manager`, `main`];
deployFunction.dependencies = [`exchange`];
