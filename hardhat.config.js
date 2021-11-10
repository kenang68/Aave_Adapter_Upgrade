require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("@openzeppelin/hardhat-upgrades");

require("dotenv").config();

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
require("./tasks/faucet");

const infuraProjectId = process.env.INFURA_PROJECT_ID;
const ropstenPrivateKey = process.env.ROPSTEN_WALLET_PRIVATE_KEY;
const kovanPrivateKey = process.env.KOVAN_WALLET_PRIVATE_KEY;
const bscTestnetPrivateKey = process.env.BSC_TESTNET_WALLET_PRIVATE_KEY;
const mainnetPrivateKey = process.env.MAINNET_WALLET_PRIVATE_KEY;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const bscScanApiKey = process.env.BSCSCAN_API_KEY;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 const config = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
  mocha: {
    // Increase the timeout value from 20000 to 60000 for below tests:
    //   - DsecDistribution: should return correct values during governance forming period
    timeout: 60000,
  },
  etherscan: {
    apiKey: getInferredNetwork().startsWith("bsc-") ? bscScanApiKey : etherscanApiKey,
  },
};

if (!config.networks) {
  config.networks = {};
}

if (ropstenPrivateKey) {
  config.networks.ropsten = {
    url: `https://ropsten.infura.io/v3/${infuraProjectId}`,
    accounts: [`0x${ropstenPrivateKey}`],
    gasMultiplier: 2, // For testnet only
  };
}

if (kovanPrivateKey) {
  config.networks.kovan = {
    url: `https://kovan.infura.io/v3/${infuraProjectId}`,
    accounts: [`0x${kovanPrivateKey}`],
    gasMultiplier: 2, // For testnet only
  };
}

if (bscTestnetPrivateKey) {
  config.networks["bsc-testnet"] = {
    url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    accounts: [`0x${bscTestnetPrivateKey}`],
    gasMultiplier: 2, // For testnet only
  };
}

if (mainnetPrivateKey) {
  config.networks.mainnet = {
    url: `https://mainnet.infura.io/v3/${infuraProjectId}`,
    accounts: [`0x${mainnetPrivateKey}`],
    gasMultiplier: 1.05,
  };
}

// https://github.com/yearn/yearn-mainnet-fork
config.networks["yearn-mainnet-fork"] = {
  url: "http://host.docker.internal:8545",
};

function getInferredNetwork() {
  const fs = require("fs");
  const path = require("path");
  const projectRootPath = __dirname;
  const projectTempPath = path.join(projectRootPath, "tmp");
  const inferredNetworkPath = path.join(projectTempPath, "inferred_network.txt");

  const args = process.argv.slice(2);
  let network = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--network" && i + 1 < args.length) {
      network = args[i + 1];
      if (!fs.existsSync(projectTempPath)) {
        fs.mkdirSync(projectTempPath);
      }
      fs.writeFileSync(inferredNetworkPath, network, { encoding: "utf8" });
      break;
    }
  }
  if (!network && fs.existsSync(inferredNetworkPath)) {
    network = fs.readFileSync(inferredNetworkPath, { encoding: "utf8" });
  }

  return network;
}

module.exports = config;

