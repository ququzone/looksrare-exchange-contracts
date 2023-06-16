import { DeployFunction } from "hardhat-deploy/types";
import { ethers, getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  // deploy CurrencyManager
  const currencyManager = await deploy("CurrencyManager", {
    from: deployer,
    log: true,
  });
  // const cm = await ethers.getContract("CurrencyManager");
  // let tx = await cm.addCurrency("0xa00744882684c3e4747faefd68d283ea44099d03"); // WETH
  // await tx.wait();

  const strategy = await ethers.getContract("StrategyStandardSaleForFixedPriceV1B");
  // deploy ExecutionManager
  const executionManager = await deploy("ExecutionManager", {
    from: deployer,
    log: true,
  });
  const em = await ethers.getContract("ExecutionManager");
  const tx = await em.addStrategy(strategy.address);
  await tx.wait();

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
deployFunction.dependencies = [`royalty`, `strategy`];
