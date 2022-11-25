import { DeployFunction } from "hardhat-deploy/types";
import { getNamedAccounts, deployments } from "hardhat";

const deployFunction: DeployFunction = async () => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // deploy StrategyStandardSaleForFixedPriceV1B
  await deploy("StrategyStandardSaleForFixedPriceV1B", {
    from: deployer,
    log: true,
    args: [],
  });
};

export default deployFunction;
deployFunction.tags = [`all`, `strategy`, `main`];
