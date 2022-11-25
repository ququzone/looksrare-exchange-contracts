import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // deploy RoyaltyFeeRegistry
  const royaltyFeeRegistry = await deploy("RoyaltyFeeRegistry", {
    from: deployer,
    log: true,
    args: [1000], // 10% limit
  });

  // deploy RoyaltyFeeManager
  await deploy("RoyaltyFeeManager", {
    from: deployer,
    log: true,
    args: [royaltyFeeRegistry.address],
  });
};

export default deployFunction;
deployFunction.tags = [`all`, `royalty`, `main`];
