import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const exchange = await get("LooksRareExchange");

  // deploy LooksRareBatch
  await deploy("LooksRareBatch", {
    from: deployer,
    log: true,
    args: [exchange.address],
  });
};

export default deployFunction;
deployFunction.tags = [`all`, `batch`, `main`];
deployFunction.dependencies = [`exchange`];
