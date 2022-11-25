import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // deploy MockERC721
  await deploy("MockERC721", {
    from: deployer,
    log: true,
    args: ["Mock NFT", "MNFT"],
  });
};

export default deployFunction;
deployFunction.tags = [`all`, `mock`];
