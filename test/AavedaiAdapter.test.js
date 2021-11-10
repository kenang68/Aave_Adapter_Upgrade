//const web3 = require('web3');
const assert = require("assert");
const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { BN, ether, ZERO_ADDRESS, ...testUtil } = require("./testUtil");
const fs = require("fs");

const expectedBlockTime = 1000;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

describe("AavedaiAdapter", () => {
  let accounts;
  let defaultGovernanceAccount;
  let defaultFarmingPoolAddress;
  let underlyingAsset;
  let aavedai;
  let aavedaiAdapter;
  let referralcode;
  let aTokenMock;
  //let reserveLogic;
  let tokenData;
  let balAToken;
  let liquidityindex;
  let depositAmt;
  let previoustime;
  let currenttime;
  let decimal;

  before(async () => {
    accounts = await web3.eth.getAccounts();
    //const accounts = await ethers.provider.listAccounts();
    console.log(accounts);
    defaultGovernanceAccount = accounts[0];
    defaultFarmingPoolAddress = accounts[5];
    referralcode = 0;
  });

  beforeEach(async () => {
    decimal = 18;
    underlyingAsset = await testUtil.newUnderlyingAssetMock();
    //console.log("Underlyingasset deployed")
    aTokenMock = await testUtil.newATokenMock("ADai Token", "ADai", decimal, underlyingAsset.address);
    //console.log("AToken deployed")
    aavedai = await testUtil.newAaveILendingPoolMock(underlyingAsset.address, aTokenMock.address);
    //console.log("LendingPool deployed")
    lendingPoolConfigurator = await testUtil.newLendingPoolConfigurator();
    //console.log("LendingPoolConfigurator deployed")
    //aavedaiAdapter = await testUtil.newAavedaiAdapter();
    aavedaiAdapter = await testUtil.newAavedaiAdapter(
    //await aavedaiAdapter.initialize(
      underlyingAsset.address,
      aavedai.address,
      defaultFarmingPoolAddress,
      aTokenMock.address,
      referralcode
    );
    tokenApproval = await testUtil.newTokenApproval(underlyingAsset.address, aavedaiAdapter.address);
    // to initialize the ILendingPool address of AToken contract
    await aTokenMock.setLendingPoolAddress(aavedai.address);
    //console.log("ILendingPoolAddress initialize in AToken")
    // to initialize the ReserveData of AToken
    await lendingPoolConfigurator.initialize(
      underlyingAsset.address,
      aTokenMock.address,
      aavedai.address,
      defaultFarmingPoolAddress,
      defaultGovernanceAccount,
      decimal

      //await aavedai.initReserve(
      //  underlyingAsset.address,
      //  aTokenMock.address,
      //  aavedai.address,
      //  defaultFarmingPoolAddress,
      //  defaultGovernanceAccount
    );
    //console.log("inintialize done")
    tokenData = await aavedai.getReserveData(underlyingAsset.address);
    //tokenData = await aavedaiAdapter.getDataReserve();
    //console.log("Read reservedata success")
  });

  it("ReserveData should be initialized correctly", async () => {
    const configuration = JSON.stringify(tokenData[0]);
    console.log("configuration: ", configuration);
    const liqIndex = JSON.stringify(tokenData[1]);
    console.log("liquidityIndex: ", liqIndex);
    const currentliquidRate = JSON.stringify(tokenData[3]);
    console.log("currentLiquidityRate: ", currentliquidRate);
    const RAY = { ray: "1000000000000000000000000000" };
    const expectliqIndex = JSON.stringify(RAY.ray);
    const tokenaddr = aTokenMock.address;
    const expecttokenaddr = tokenData[7];

    console.log("AToken Name: ", await aTokenMock.name());
    console.log("AToken Symbol: ", await aTokenMock.symbol());
    console.log("AToken Decimals: ", (await aTokenMock.decimals()).toString());

    assert.strictEqual(
      tokenData[1],
      RAY.ray,
      `Liquidity Index is ${tokenData[1]} instead of treasury pool creator address ${RAY.ray}`
    );

    assert.strictEqual(
      liqIndex,
      expectliqIndex,
      `Liquidity Index is ${liqIndex} instead of treasury pool creator address ${expectliqIndex}`
    );

    assert.strictEqual(
      tokenaddr,
      expecttokenaddr,
      `aToken address is ${tokenaddr} instead of treasury pool creator address ${expecttokenaddr}`
    );
  });

  it("should be initialized correctly", async () => {
    const governanceAccount = await aavedaiAdapter.governanceAccount();
    const underlyingAssetAddress = await aavedaiAdapter.underlyingAssetAddress();
    const aTokenAddress = await aavedaiAdapter.aTokenAddress();
    const programAddress = await aavedaiAdapter.programAddress();
    const farmingPoolAddress = await aavedaiAdapter.farmingPoolAddress();
    const referralCode = await aavedaiAdapter.referralCode();

    const expectGovernanceAccount = defaultGovernanceAccount;
    const expectUnderlyingAssetAddress = underlyingAsset.address;
    const expectATokenAddress = aTokenMock.address;
    const expectProgramAddress = aavedai.address;
    const expectFarmingPoolAddress = defaultFarmingPoolAddress;
    const expectReferralCode = referralcode;

    await expectRevert(
      testUtil.newAavedaiAdapter(ZERO_ADDRESS, aavedai.address, farmingPoolAddress, aTokenMock.address, referralcode),
      "AavedaiAdapter: underlying asset address is the zero address"
    );
    await expectRevert(
      testUtil.newAavedaiAdapter(
        underlyingAsset.address,
        ZERO_ADDRESS,
        farmingPoolAddress,
        aTokenMock.address,
        referralcode
      ),
      "AavedaiAdapter: aaveDai address is the zero address"
    );
    await expectRevert(
      testUtil.newAavedaiAdapter(
        underlyingAsset.address,
        aavedai.address,
        ZERO_ADDRESS,
        aTokenMock.address,
        referralcode
      ),
      "AavedaiAdapter: farming pool address is the zero address"
    );

    assert.strictEqual(
      governanceAccount,
      expectGovernanceAccount,
      `Governance account is ${governanceAccount} instead of treasury pool creator address ${expectGovernanceAccount}`
    );
    assert.strictEqual(
      underlyingAssetAddress,
      expectUnderlyingAssetAddress,
      `Underlying asset address is ${underlyingAssetAddress} instead of ${expectUnderlyingAssetAddress}`
    );

    assert.strictEqual(
      aTokenAddress,
      expectATokenAddress,
      `Underlying asset address is ${aTokenAddress} instead of ${expectATokenAddress}`
    );

    assert.strictEqual(
      programAddress,
      expectProgramAddress,
      `Program address is ${programAddress} instead of ${expectProgramAddress}`
    );
    assert.strictEqual(
      farmingPoolAddress,
      expectFarmingPoolAddress,
      `Farming pool address is ${farmingPoolAddress} instead of ${expectFarmingPoolAddress}`
    );
  });

  it("should only allow farming pool to deposit", async () => {
    console.log("should only allow farming pool to deposit");
    const nonFarmingPoolAddress = accounts[6];

    const depositAmount = ether("9.9");

    await expectRevert(
      depositUnderlyingToken(depositAmount, nonFarmingPoolAddress),
      "AavedaiAdapter: sender not authorized"
    );

    //await depositUnderlyingToken(depositAmount, defaultFarmingPoolAddress);

    await assert.doesNotReject(async () => await depositUnderlyingToken(depositAmount, defaultFarmingPoolAddress));

    console.log("After depositing");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());
  });

  it("should not allow to deposit 0", async () => {
    await expectRevert(depositUnderlyingToken(ether("0"), defaultFarmingPoolAddress), "AavedaiAdapter: can't add 0");
  });

  it("should only allow farming pool to redeem", async () => {
    console.log("should only allow farming pool to redeem");

    const nonFarmingPoolAddress = accounts[6];

    let depositAmount = ether("9.9");
    await depositUnderlyingToken(depositAmount, defaultFarmingPoolAddress);

    await expectRevert(
      aavedaiAdapter.redeemWrappedToken(depositAmount, { from: nonFarmingPoolAddress }),
      "AavedaiAdapter: sender not authorized"
    );

    console.log("After depositing");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    depositAmount = ether("9.5");

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmount, { from: defaultFarmingPoolAddress })
    );

    console.log("After redeeming");

    balance = await underlyingAsset.balanceOf(defaultFarmingPoolAddress);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of FarmingPoolAddress in underlyingAsset:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());
  });

  it("should not allow to redeem 0", async () => {
    const depositAmount = ether("9.9");

    await depositUnderlyingToken(depositAmount, defaultFarmingPoolAddress);

    await expectRevert(
      aavedaiAdapter.redeemWrappedToken(ether("0"), { from: defaultFarmingPoolAddress }),
      "AavedaiAdapter: can't redeem 0"
    );
  });

  it("should only allow governance account to change governance account", async () => {
    const nonGovernanceAccount = accounts[6];

    await expectRevert(
      aavedaiAdapter.setGovernanceAccount(nonGovernanceAccount, { from: nonGovernanceAccount }),
      "AavedaiAdapter: sender not authorized"
    );
    await assert.doesNotReject(
      async () =>
        await aavedaiAdapter.setGovernanceAccount(defaultGovernanceAccount, { from: defaultGovernanceAccount })
    );
  });

  it("should be changed to the specific farming pool address", async () => {
    const expectNewFarmingPoolAddress = accounts[6];

    await aavedaiAdapter.setFarmingPoolAddress(expectNewFarmingPoolAddress, { from: defaultGovernanceAccount });
    const newFarmingPoolAddress = await aavedaiAdapter.farmingPoolAddress();

    await expectRevert(
      aavedaiAdapter.setFarmingPoolAddress(ZERO_ADDRESS, { from: defaultGovernanceAccount }),
      "AavedaiAdapter: new farming pool address is the zero address"
    );
    assert.strictEqual(
      newFarmingPoolAddress,
      expectNewFarmingPoolAddress,
      `New farming pool address is ${newFarmingPoolAddress} instead of ${expectNewFarmingPoolAddress}`
    );
    await sleep(expectedBlockTime);
  });

  //it("should only allow governance account to sweep", async () => {
  //  const nonGovernanceAccount = accounts[6];
  //  const sweepTargetAccount = accounts[7];

  //  await expectRevert(
  //    aavedaiAdapter.sweep(sweepTargetAccount, { from: nonGovernanceAccount }),
  //    "AavedaiAdapter: sender not authorized"
  //  );
  //  await assert.doesNotReject(
  //    async () => await aavedaiAdapter.sweep(sweepTargetAccount, { from: defaultGovernanceAccount })
  //  );
  //  await sleep(expectedBlockTime);
  //});

  it("test the functions of AavedaiAdapter contract", async () => {
    depositAmt = ether("2.0");

    console.log("Before depositing");

    balance = await underlyingAsset.balanceOf(defaultFarmingPoolAddress);
    formattedBalance = web3.utils.fromWei(balance);

    console.log(
      "Before depositing 2.0 ethers in underlyingAsset at aavedaiAdapter.address:",
      formattedBalance.toString()
    );

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying();
    formattedBalance = web3.utils.fromWei(liquidityindex);

    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    ////
    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);
    ////

    console.log("After depositing");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying();
    formattedBalance = web3.utils.fromWei(liquidityindex);

    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    await sleep(expectedBlockTime)

    depositAmt = ether("2.0");

    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);

    console.log("After depositing 2.0 ethers");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying();
    formattedBalance = web3.utils.fromWei(liquidityindex);

    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    depositAmt = ether("2.0");

    ////
    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);
    ////

    console.log("After depositing 2.0 ethers");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying();
    formattedBalance = web3.utils.fromWei(liquidityindex);

    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    depositAmt = ether("2.0");

    ////
    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);
    ////

    console.log("After depositing 2.0 ethers");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying();
    formattedBalance = web3.utils.fromWei(liquidityindex);

    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    depositAmt = ether("2.0");

    ////
    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);
    ////

    console.log("After depositing 2.0 ethers");

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);
    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying();
    formattedBalance = web3.utils.fromWei(liquidityindex);
    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    console.log("After redeeming 2.0 ethers");

    balance = await underlyingAsset.balanceOf(defaultFarmingPoolAddress);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of FarmingPoolAddress in underlyingAsset:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(balAToken);
    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(liquidityindex);
    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    console.log("After redeeming 2.0 ethers");

    balance = await underlyingAsset.balanceOf(defaultFarmingPoolAddress);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of FarmingPoolAddress in underlyingAsset:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(liquidityindex);
    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    console.log("After redeeming 2.0 ethers");

    balance = await underlyingAsset.balanceOf(defaultFarmingPoolAddress);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of FarmingPoolAddress in underlyingAsset:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(liquidityindex);

    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    previoustime = Date.now;
    currenttime = previoustime;
    while (currenttime - previoustime < 5000) {
      currenttime = Date.now;
    }

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    console.log("After redeeming 2.0 ethers");

    balance = await underlyingAsset.balanceOf(defaultFarmingPoolAddress);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of FarmingPoolAddress in underlyingAsset:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());
    balance = await aTokenMock.scaledBalanceOf(aavedaiAdapter.address);
    formattedBalance = web3.utils.fromWei(balance);

    console.log("Balance of ATokenMock asset of aavedaiAdapter address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(balAToken);

    console.log(
      "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
      formattedBalance.toString()
    );

    liquidityindex = await aavedaiAdapter.getWrappedTokenPriceInUnderlying({ from: aavedaiAdapter.address });
    formattedBalance = web3.utils.fromWei(liquidityindex);
    console.log(
      "LiquidityIndex using function call aavedaiAdapter.getWrappedTokenPriceInUnderlying():",
      formattedBalance.toString()
    );

    // testing sweep function
  //  const sweepTargetAccount = accounts[7];
  //  console.log("Before sweep");
  //  balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
  //  formattedBalance = web3.utils.fromWei(balAToken);
  //  console.log(
  //    "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
  //    formattedBalance.toString()
  //  );

  //  balance = await aTokenMock.scaledBalanceOf(sweepTargetAccount);
  //  formattedBalance = web3.utils.fromWei(balance);
  //  console.log("Balance of ATokenMock in sweepTargetAccount:", formattedBalance.toString());

    // sweep function
  //  aavedaiAdapter.sweep(sweepTargetAccount, { from: defaultGovernanceAccount });

  //  console.log("After sweep");

  //  balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
  //  formattedBalance = web3.utils.fromWei(balAToken);
  //  console.log(
  //    "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
  //    formattedBalance.toString()
  //  );

  //  balance = await aTokenMock.scaledBalanceOf(sweepTargetAccount);
  //  formattedBalance = web3.utils.fromWei(balance);
  //  console.log("Balance of ATokenMock in sweepTargetAccount:", formattedBalance.toString());

  //  balAToken = await aavedaiAdapter.getTotalWrappedToken({ from: aavedaiAdapter.address });
  //  formattedBalance = web3.utils.fromWei(balAToken);
  //  console.log(
  //    "Balance of ATokenMock using function call aavedaiAdapter.getTotalWrappedToken():",
  //    formattedBalance.toString()
  //  );

  //  await sleep(expectedBlockTime);

  //  balance = await aTokenMock.scaledBalanceOf(sweepTargetAccount);
  //  formattedBalance = web3.utils.fromWei(balance);
  //  console.log("Balance of ATokenMock in sweepTargetAccount:", formattedBalance.toString());
  });

  it("should allow multiple deposit and redeem", async () => {
    // to initialize the ILendingPool address of AToken contract
    //await aTokenMock.setLendingPoolAddress(aavedai.address);
    // to initialize the ReserveData of AToken
    //await aavedai.initReserve(
    //  underlyingAsset.address,
    //  aTokenMock.address,
    //  aavedai.address,
    //  defaultFarmingPoolAddress,
    //  defaultGovernanceAccount
    //);
    depositAmt = ether("2.0");

    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);

    balance = new BN(await underlyingAsset.balanceOf(aTokenMock.address));

    assert.ok(balance.eq(ether("2.0")), `balance is ${balance} instead of ${ether("2.0")}`);

    depositAmt = ether("2.0");

    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);

    balance = new BN(await underlyingAsset.balanceOf(aTokenMock.address));
    assert.ok(balance.eq(ether("4.0")), `balance is ${balance} instead of ${ether("4.0")}`);

    depositAmt = ether("2.0");

    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);

    balance = new BN(await underlyingAsset.balanceOf(aTokenMock.address));
    assert.ok(balance.eq(ether("6.0")), `balance is ${balance} instead of ${ether("6.0")}`);

    depositAmt = ether("2.0");

    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);

    balance = new BN(await underlyingAsset.balanceOf(aTokenMock.address));
    assert.ok(balance.eq(ether("8.0")), `balance is ${balance} instead of ${ether("8.0")}`);

    depositAmt = ether("2.0");

    await depositUnderlyingToken(depositAmt, defaultFarmingPoolAddress);

    balance = new BN(await underlyingAsset.balanceOf(aTokenMock.address));
    assert.ok(balance.eq(ether("10.0")), `balance is ${balance} instead of ${ether("10.0")}`);

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    balance = new BN(await underlyingAsset.balanceOf(defaultFarmingPoolAddress));
    assert.ok(balance.gt(ether("2.0")), `The redeem underlyingAsset in FarmingPool should be greater than 2`);

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    balance = new BN(await underlyingAsset.balanceOf(defaultFarmingPoolAddress));
    assert.ok(balance.gt(ether("4.0")), `The redeem underlyingAsset in FarmingPool should be greater than 4`);

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    balance = new BN(await underlyingAsset.balanceOf(defaultFarmingPoolAddress));
    assert.ok(balance.gt(ether("6.0")), `The redeem underlyingAsset in FarmingPool should be greater than 6`);

    await assert.doesNotReject(
      async () => await aavedaiAdapter.redeemWrappedToken(depositAmt, { from: defaultFarmingPoolAddress })
    );

    balance = new BN(await underlyingAsset.balanceOf(defaultFarmingPoolAddress));
    assert.ok(balance.gt(ether("8.0")), `The redeem underlyingAsset in FarmingPool should be greater than 8`);
  });


  it("tokenapproval: test approve and allowance function", async () => {

    depositAmt = ether("5.0");
    await tokenApproval.approveUnderlyingToken(aavedaiAdapter.address, depositAmt);
    const allowance = await tokenApproval.getdaiallowanceforxfer(tokenApproval.address, aavedaiAdapter.address);
    assert.ok(allowance.eq(ether("5.0")), `Token allowance amount is ${allowance} instead of approval amount is ${depositAmt}`);
  });

  it("tokenapproval: test deposit and redeem function", async () => {

    await aavedaiAdapter.setFarmingPoolAddress(tokenApproval.address, { from: defaultGovernanceAccount });
    depositAmt = ether("15.0");
    await underlyingAsset.mint(tokenApproval.address, depositAmt, { from: defaultGovernanceAccount });

    balance = await underlyingAsset.balanceOf(tokenApproval.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of tokenApproval contract:", formattedBalance.toString());

    await tokenApproval.depositfivedai();

    balance = await underlyingAsset.balanceOf(tokenApproval.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of tokenApproval contract:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);
    console.log(
      "Balance of ATokenMock in aavedaiAdapter contract:",
      formattedBalance.toString()
    );

    await tokenApproval.depositfivedai();

    balance = await underlyingAsset.balanceOf(tokenApproval.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of tokenApproval contract:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);
    console.log(
      "Balance of ATokenMock in aavedaiAdapter contract:",
      formattedBalance.toString()
    );

    await tokenApproval.approveredeemfiveadai();

    balance = await underlyingAsset.balanceOf(tokenApproval.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of tokenApproval contract:", formattedBalance.toString());

    balance = await underlyingAsset.balanceOf(aTokenMock.address);
    formattedBalance = web3.utils.fromWei(balance);
    console.log("Balance of underlyingAsset of ATokenMock address:", formattedBalance.toString());

    balAToken = await aavedaiAdapter.getTotalWrappedToken();
    formattedBalance = web3.utils.fromWei(balAToken);
    console.log(
      "Balance of ATokenMock in aavedaiAdapter contract:",
      formattedBalance.toString()
    );
  });

  it("should only allow governance account to transfer token out of contract", async () => {
    const nonGovernanceAccount = accounts[6];

    depositAmt = ether("5.0");
    await underlyingAsset.mint(tokenApproval.address, depositAmt, { from: defaultGovernanceAccount });

    await expectRevert(
      tokenApproval.xfertowallet(nonGovernanceAccount, depositAmt, { from: nonGovernanceAccount }),
      "AavedaiAdapter: sender not authorized"
    );
    await assert.doesNotReject(
      async () =>
        await tokenApproval.xfertowallet(defaultGovernanceAccount, depositAmt, { from: defaultGovernanceAccount })
    );
  });

  async function depositUnderlyingToken(amount, farmingPoolAddress) {
    await underlyingAsset.mint(farmingPoolAddress, amount, { from: defaultGovernanceAccount });
    await underlyingAsset.approve(aavedaiAdapter.address, amount, { from: farmingPoolAddress });
    return await aavedaiAdapter.depositUnderlyingToken(amount, { from: farmingPoolAddress });
  }
});