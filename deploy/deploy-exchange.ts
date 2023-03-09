import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  // deploy CurrencyManager
  const currencyManager = await deploy("CurrencyManager", {
    from: deployer,
    log: true,
  });

  // deploy ExecutionManager
  const executionManager = await deploy("ExecutionManager", {
    from: deployer,
    log: true,
  });

  const royaltyFeeManager = await get("RoyaltyFeeManager");

  await deploy("LooksRareExchange", {
    from: deployer,
    log: true,
    args: [
      currencyManager.address,
      executionManager.address,
      royaltyFeeManager.address,
      "0xa00744882684c3e4747faefd68d283ea44099d03", // WETH
      deployer, // protocolFeeRecipient
    ],
  });
};

export default deployFunction;
deployFunction.tags = [`all`, `exchange`, `main`];
deployFunction.dependencies = [`royalty`];
