const fs = require("fs");
//const Web3 = require('web3')
//const BN = web3.utils.BN;
const ETH = 1000000000000000000;

// This file is only here to make interacting with the Dapp easier,
// feel free to ignore it if you don't need it.

task("faucet", "Sends ETH and tokens to an address")
  .addPositionalParam("receiver", "The address that will receive them")
  .setAction(async ({ receiver }) => {
    if (network.name === "hardhat") {
      console.warn(
        "You are running the faucet task with Hardhat network, which" +
          "gets automatically created and destroyed every time. Use the Hardhat" +
          " option '--network localhost'"
      );
    }

    const addressesFile =
      __dirname + "/../frontend/src/contracts/underlyingAssetMock-address.json";

    if (!fs.existsSync(addressesFile)) {
      console.error("You need to deploy your contract first");
      return;
    }

    const addressJson = fs.readFileSync(addressesFile);
    const address = JSON.parse(addressJson);

    if ((await ethers.provider.getCode(address.Token)) === "0x") {
      console.error("You need to deploy your contract first");
      return;
    }

    console.log("UnderlyingAssetMock address :", address.Token);

    const token = await ethers.getContractAt("UnderlyingAssetMock", address.Token);
    const [sender] = await ethers.getSigners();

    console.log("UnderlyingAssetMock address :", address.Token);

    count = 10;
    while (count>0) {
      //tx = await token.mint(receiver, ethers.constants.WeiPerEther);
      tx = await token.mint(receiver, web3.utils.toWei("50", "ether"));
      await tx.wait();
      count--;
      console.log("Count :", count);
    }

    //const tx = await token.mint(receiver, ethers.constants.WeiPerEther);
    //await tx.wait();

    const tx2 = await sender.sendTransaction({
      to: receiver,
      value: ethers.constants.WeiPerEther,
    });
    await tx2.wait();

    console.log(`Transferred 1 ETH and 100 tokens to ${receiver}`);
  });

  //function ether(ether) {
  //  return new BN(web3.utils.toWei(ether, "ether"));
  //}
