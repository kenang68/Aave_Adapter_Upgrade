// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const inquirer = require("inquirer");
const deployUtil = require("./deployUtil");
const { ethers, upgrades } = require("hardhat");

require("dotenv").config();

//async function main() {
  //const answers = await inquirer.prompt([
  //  {
  //    name: "treasuryPoolAddress",
  //    type: "input",
  //    message: "Please provide the treasury pool address for the farming pool to be deployed:",
  //    validate: (value) => {
  //      const isValid = hre.ethers.utils.isAddress(value);
  //      if (!isValid) {
  //        console.log(" ❌");
  //      }
  //      return isValid;
  //    },
  //  },
  //]);
  //await deploy(answers.treasuryPoolAddress);
//}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const network = hre.network.name;
  const accounts = await hre.ethers.getSigners();
  console.log(accounts[0].address);

  // ethers is avaialble in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  //const Btoken = await hre.ethers.getContractFactory("Btoken");
  const UnderlyingAssetMock = await hre.ethers.getContractFactory("UnderlyingAssetMock");
  //const TreasuryPool = await hre.ethers.getContractFactory("TreasuryPool");
  //const FarmingPool = await hre.ethers.getContractFactory("FarmingPool");
  //const YearnVaultV2Mock = await hre.ethers.getContractFactory("YearnVaultV2Mock");
  //const YvdaiAdapter = await hre.ethers.getContractFactory("YvdaiAdapter");

  // to deploy Aave Adapter
  const AaveILendingPoolMock = await hre.ethers.getContractFactory("AaveILendingPoolMock");
  const AavedaiAdapter = await hre.ethers.getContractFactory("AavedaiAdapter");
  const ATokenMock = await hre.ethers.getContractFactory("ATokenMock");
  const LendingPoolConfigurator = await hre.ethers.getContractFactory("LendingPoolConfigurator");
  const TokenApproval = await hre.ethers.getContractFactory("TokenApproval");

  //const ropstenUnderlyingAssetAddress = process.env.ROPSTEN_DAI_ADDRESS ?? deployUtil.references.addresses.dai.ropsten;
  const kovanUnderlyingAssetAddress = process.env.KOVAN_DAI_ADDRESS ?? deployUtil.references.addresses.dai.kovan;
  const mainnetUnderlyingAssetAddress = deployUtil.references.addresses.dai.mainnet;
  //const bscTestnetUnderlyingAssetAddress = deployUtil.references.addresses.dai["bsc-testnet"];
  //const ropstenYvdaiAddress = process.env.ROPSTEN_YVDAI_ADDRESS;
  //const kovanYvdaiAddress = process.env.KOVAN_YVDAI_ADDRESS;
  // Aave ILendingPool Address
  const kovanAavedaiAddress = process.env.KOVAN_AAVEDAI_ADDRESS;
  const kovanATokenAddress = process.env.KOVAN_ATOKEN_ADDRESS;
  const kovanFarmingAddress = process.env.KOVAN_FARMING_ADDRESS;

  //const mainnetYvdaiAddress = deployUtil.references.addresses.yvdai.mainnet;
  //const bscTestnetYvdaiAddress = process.env.BSC_TESTNET_YVDAI_ADDRESS;

  //const btokenArguments = ["BDai Token", "BDai"];
  //const btoken = await deployUtil.deployContract(Btoken, btokenArguments, true);
  //let treasuryPool = TreasuryPool.attach(treasuryPoolAddress);
  //let farmingPoolArguments;
  //let farmingPool;
  //let yvdaiAdapterArguments;
  //let yvdaiAdapter;

  // add Aave Adapter declaration
  let aavedaiAdapterArguments;
  let aavedaiAdapter;
  let farmingPoolAddress;

  // add AToken declaration
  let aTokenArguments;
  let aTokenMock;
  let aTokenAddress;

  let lendingPoolConfigurator;
  let lendingPoolConfiguratorAddress;
  let lendingPoolConfiguratorArguments;
  let decimal;

  let tokenApproval;
  let tokenApprovalArguments;


  // add Aave Adapter declaration
  let aavedaiAddress;
  let referralCode;

  let underlyingAssetAddress;
  let underlyingAssetMock;
  let aaveILendingPoolMockArguments;
  //let yvdaiAddress;
  //let insuranceFundAddress;
  //let leverageFactor;
  //let liquidityPenalty;
  //let taxRate;

  let isLiveNetwork = true;
  if (network === "mainnet") {
    underlyingAssetAddress = mainnetUnderlyingAssetAddress;
    //yvdaiAddress = mainnetYvdaiAddress;
    //insuranceFundAddress = process.env.MAINNET_INSURANCE_FUND_ADDRESS;
    //leverageFactor = 20;
    //liquidityPenalty = 10;
    //taxRate = 10;
  //} else if (network === "ropsten") {
  //  underlyingAssetAddress = ropstenUnderlyingAssetAddress;
  //  yvdaiAddress = ropstenYvdaiAddress;
  //  insuranceFundAddress = process.env.ROPSTEN_INSURANCE_FUND_ADDRESS;
  //  leverageFactor = 20;
  //  liquidityPenalty = 10;
  //  taxRate = 10;
  } else if (network === "kovan") {
    underlyingAssetAddress = kovanUnderlyingAssetAddress;
    //yvdaiAddress = kovanYvdaiAddress;
    //Aave ILendingPool Kovan address
    aavedaiAddress = kovanAavedaiAddress;
    aTokenAddress = kovanATokenAddress;

    saveFrontendAddress("UnderlyingAssetMock", underlyingAssetAddress);
    saveFrontendAddress("ATokenMock", aTokenAddress);
    saveFrontendAddress("AaveILendingPoolMock", aavedaiAddress);
    //insuranceFundAddress = process.env.KOVAN_INSURANCE_FUND_ADDRESS;
    //leverageFactor = 20;
    //liquidityPenalty = 10;
    //taxRate = 10;
  //} else if (network === "bsc-testnet") {
  //  underlyingAssetAddress = bscTestnetUnderlyingAssetAddress;
  //  yvdaiAddress = bscTestnetYvdaiAddress;
  //  insuranceFundAddress = process.env.BSC_TESTNET_INSURANCE_FUND_ADDRESS;
  //  leverageFactor = 20;
  //  liquidityPenalty = 10;
  //  taxRate = 10;
  } else if (network === "localhost" || network === "yearn-mainnet-fork") {
    isLiveNetwork = false;
    if (network === "yearn-mainnet-fork") {
      underlyingAssetAddress = mainnetUnderlyingAssetAddress;
      //yvdaiAddress = mainnetYvdaiAddress;
    } else if (network === "localhost") {
      underlyingAssetMockArguments = ["Dai Mock", "Dai Mock"];
      underlyingAssetMock = await deployUtil.deployContract(
        UnderlyingAssetMock,
        underlyingAssetMockArguments,
        true
      );
      await underlyingAssetMock.deployed();
      underlyingAssetAddress = underlyingAssetMock.address;
      // We also save the contract's artifacts and address in the frontend directory
      saveFrontendFiles("UnderlyingAssetMock", underlyingAssetMock);

      //const yearnVaultV2MockArguments = [underlyingAssetAddress];
      //const yearnVaultV2Mock = await deployUtil.deployContract(YearnVaultV2Mock, yearnVaultV2MockArguments, false);
      //await yearnVaultV2Mock.deployed();
      //yvdaiAddress = yearnVaultV2Mock.address;

      //deploy Aave ATokenMock
      const aTokenArguments = ["ADai", "ADai", 18, underlyingAssetAddress];
      //const aTokenArguments = [aavedaiAddress];
      const aTokenMock = await deployUtil.deployContract(ATokenMock, aTokenArguments, true);
      await aTokenMock.deployed();
      aTokenAddress = aTokenMock.address;
      // We also save the contract's artifacts and address in the frontend directory
      saveFrontendFiles("ATokenMock", aTokenMock);

      //deploy Aave ILendingPoolMock
      const aaveILendingPoolMockArguments = [underlyingAssetAddress, aTokenAddress];
      const aaveILendingPoolMock = await deployUtil.deployContract(
        AaveILendingPoolMock,
        aaveILendingPoolMockArguments,
        true
      );
      await aaveILendingPoolMock.deployed();
      aavedaiAddress = aaveILendingPoolMock.address;
      // We also save the contract's artifacts and address in the frontend directory
      saveFrontendFiles("AaveILendingPoolMock", aaveILendingPoolMock);
      // to initialize the ILendingPool address of ATokenMock contract
      await aTokenMock.setLendingPoolAddress(aavedaiAddress);
      console.log("iLendingPoolAddress address:", await aTokenMock.iLendingPoolAddress());
      console.log("aavedaiAddress address:", aavedaiAddress);

      // deploy the LendingPoolConfigurator contract
      //const lendingPoolConfiguratorArguments = [];
      //const lendingPoolConfigurator = await deployUtil.deployContract(
      //  LendingPoolConfigurator,
      //  lendingPoolConfiguratorArguments,
      //  true
      //);
      const lendingPoolConfigurator = await LendingPoolConfigurator.deploy();
      await lendingPoolConfigurator.deployed();
      lendingPoolConfiguratorAddress = lendingPoolConfigurator.address;
      console.log("lendingPoolConfigurator Address deployed to:", lendingPoolConfiguratorAddress);
      // initialize ReserveData
      decimal = 18;
      await lendingPoolConfigurator.initialize(
        underlyingAssetAddress,
        aTokenAddress,
        aavedaiAddress,
        accounts[1].address,
        accounts[2].address,
        decimal
  
      );
      console.log("ReserveData initialied");

      // to initialize the ILendingPool address of ATokenMock contract
      await aTokenMock.setLendingPoolAddress(aavedaiAddress);
      console.log("iLendingPoolAddress address:", await aTokenMock.iLendingPoolAddress());
      console.log("aavedaiAddress address:", aavedaiAddress);

    }
    //insuranceFundAddress = accounts[2].address;
    //leverageFactor = 20;
    //liquidityPenalty = 10;
    //taxRate = 10;
  } else {
    throw new Error(`Unknown network: ${network}`);
  }

  if (underlyingAssetAddress === undefined) {
    throw new Error("Unknown underlying asset address");
  } else if (aavedaiAddress === undefined) {
    throw new Error("Unknown aaveDAI address");
  } else if (aTokenAddress === undefined) {
    throw new Error("Unknown ADai address");
  //} else if (insuranceFundAddress === undefined) {
  //  throw new Error("Unknown insurance fund address");
  //} else if (leverageFactor === undefined) {
  //  throw new Error("Unknown leverage factor");
  //} else if (liquidityPenalty === undefined) {
  //  throw new Error("Unknown liquidity penalty");
  //} else if (taxRate === undefined) {
  //  throw new Error("Unknown taxRate");
  }

  //farmingPoolArguments = [
  //  "Yearn DAI Vault",
  //  underlyingAssetAddress,
  //  btoken.address,
  //  treasuryPool.address,
  //  insuranceFundAddress,
  //  leverageFactor,
  //  liquidityPenalty,
  //  taxRate,
  //];
  //farmingPool = await deployUtil.deployContract(FarmingPool, farmingPoolArguments, true);

  //yvdaiAdapterArguments = [
  //  underlyingAssetAddress, //
  //  yvdaiAddress,
  //  farmingPool.address,
  //];
  //yvdaiAdapter = await deployUtil.deployContract(YvdaiAdapter, yvdaiAdapterArguments, true);

  // add aavedaiAdapter
  
  if (network === "kovan") {
    farmingPoolAddress = kovanFarmingAddress;
    
  } else {
    farmingPoolAddress = accounts[1].address;
  }

  referralCode = 0;

  //if (tokenApprovalAddress === undefined) {
  //  throw new Error("Unknown tokenApproval address");
  //}



  aavedaiAdapterArguments = [
    underlyingAssetAddress, //
    aavedaiAddress,
    farmingPoolAddress,
    aTokenAddress,
    referralCode,
  ];
  aavedaiAdapter = await deployUtil.deployContract(AavedaiAdapter, aavedaiAdapterArguments, true);
  //aavedaiAdapter = await upgrades.deployProxy(AavedaiAdapter, 
  //  [underlyingAssetAddress, aavedaiAddress, 
  //  farmingPoolAddress, aTokenAddress, referralCode]
  //  , { initializer: 'initialize' });

  tokenApprovalArguments = [underlyingAssetAddress, aavedaiAdapter.address];
  tokenApproval = await deployUtil.deployContract(
      TokenApproval,
      tokenApprovalArguments,
      true
  );

  //await btoken.deployed();
  //await farmingPool.deployed();
  //await yvdaiAdapter.deployed();
  await tokenApproval.deployed();
  await aavedaiAdapter.deployed();
  //console.log("BDai deployed to:", btoken.address);
  //console.log("FarmingPool deployed to:", farmingPool.address);
  //console.log("YvdaiAdapter deployed to:", yvdaiAdapter.address);
  console.log("UnderlyingAsset deployed to:", underlyingAssetAddress);
  console.log("LendingPool Address deployed to:", aavedaiAddress);
  console.log("AToken Address deployed to:", aTokenAddress);
  console.log("FarmingPool Address deployed to:", farmingPoolAddress);
  console.log("AavedaiAdapter deployed to:", aavedaiAdapter.address);
  console.log("tokenApproval Address deployed to:", tokenApproval.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles("AavedaiAdapter", aavedaiAdapter);


  // Verify the source code if it is deployed to live networks
  if (isLiveNetwork) {
    //await deployUtil.tryVerifyContract(btoken, btokenArguments);
    //await deployUtil.tryVerifyContract(farmingPool, farmingPoolArguments);
    //await deployUtil.tryVerifyContract(yvdaiAdapter, yvdaiAdapterArguments);
    if (network === "kovan") {
      //await tokenApproval.deployed();
      //tokenApprovalAddress = tokenApproval.address;
      //console.log("tokenApproval Address deployed to:", tokenApprovalAddress);
      await deployUtil.tryVerifyContract(tokenApproval, tokenApprovalArguments);
    }
    await deployUtil.tryVerifyContract(aavedaiAdapter, aavedaiAdapterArguments);
    //await deployUtil.tryVerifyContract(aavedaiAdapter);
    
  }

  // Post-Deployment
  //await btoken.setFarmingPoolAddress(farmingPool.address);
  //await treasuryPool.addFarmingPoolAddress(farmingPool.address);
  //await farmingPool.setAdapterAddress(yvdaiAdapter.address);
  //await aavedaiAdapter.setFarmingPoolAddress(tokenApproval.address);
  await aavedaiAdapter.setFarmingPoolAddress(accounts[0].address);
  //await underlyingAssetMock.mint(accounts[1].address, ethers.constants.WeiPerEther);
  if (network === "localhost") {
    await underlyingAssetMock.mint(accounts[1].address, web3.utils.toWei("500", "ether"));
  }
}

function saveFrontendFiles(tokenname, token) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  let str = "/";
  str += tokenname;
  str += "-address.json";
  console.log("address file name: ", str);

  fs.writeFileSync(
    contractsDir + str,
    JSON.stringify({ Token: token.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync(tokenname);

  str = "/";
  str += tokenname;
  str += ".json";
  console.log("address file name: ", str);

  fs.writeFileSync(
    contractsDir + str,
    JSON.stringify(TokenArtifact, null, 2)
  );
}

function saveFrontendAddress(tokenname, address) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  let str = "/";
  str += tokenname;
  str += "-kovanaddress.json";
  console.log("address file name: ", str);

  fs.writeFileSync(
    contractsDir + str,
    JSON.stringify({ Token: address }, undefined, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
