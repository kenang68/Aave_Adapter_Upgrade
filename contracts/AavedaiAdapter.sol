// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "./interfaces/ILendingPool.sol";
import {IAToken} from "./interfaces/IAToken.sol";
import "./AdapterBase.sol";
import {DataTypes} from "./libraries/types/DataTypes.sol";
import {WadRayMath} from "./libraries/math/WadRayMath.sol";

// Contract to interface to Aave ILendingPool
contract AavedaiAdapter is AdapterBase, Initializable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using WadRayMath for uint128;

    address public governanceAccount;
    address public underlyingAssetAddress;
    address public programAddress;
    address public farmingPoolAddress;
    address public aTokenAddress;
    uint16 public referralCode;
    uint256 internal constant WAD = 1e18;

    ILendingPool private _aavedai;
    IERC20 private _underlyingAsset;

    event Sweep(
        address thisaddress,
        address receiver,
        address assetAddress,
        uint256 amount,
        address owner,
        uint256 timestamp
    );

    //function initialize(
    //    address underlyingAssetAddress_, 
    //    address programAddress_, 
    //    address farmingPoolAddress_, 
    //    address aTokenAddress_, 
    //    uint16 referralCode_
    //) public initializer {
    //    require(
    //        underlyingAssetAddress_ != address(0),
    //        "AavedaiAdapter: underlying asset address is the zero address"
    //    );
    //    require(
    //        programAddress_ != address(0),
    //        "AavedaiAdapter: aaveDai address is the zero address"
    //    );
    //    require(
    //        farmingPoolAddress_ != address(0),
    //        "AavedaiAdapter: farming pool address is the zero address"
    //    );
    //    require(
    //        aTokenAddress_ != address(0),
    //        "AavedaiAdapter: farming pool address is the zero address"
    //    );

    //    governanceAccount = msg.sender;
    //    underlyingAssetAddress = underlyingAssetAddress_;
    //    programAddress = programAddress_;
    //    farmingPoolAddress = farmingPoolAddress_;
    //    aTokenAddress = aTokenAddress_;
    //    referralCode = referralCode_;

    //    _aavedai = ILendingPool(programAddress);
    //    _underlyingAsset = IERC20(underlyingAssetAddress);
    //}

    // Add referralCode to the constructor
    constructor(
        address underlyingAssetAddress_,
        address programAddress_,
        address farmingPoolAddress_,
        address aTokenAddress_,
        uint16 referralCode_
    ) {
        require(
            underlyingAssetAddress_ != address(0),
            "AavedaiAdapter: underlying asset address is the zero address"
        );
        require(
            programAddress_ != address(0),
            "AavedaiAdapter: aaveDai address is the zero address"
        );
        require(
            farmingPoolAddress_ != address(0),
            "AavedaiAdapter: farming pool address is the zero address"
        );
        require(
            aTokenAddress_ != address(0),
            "AavedaiAdapter: farming pool address is the zero address"
        );

        governanceAccount = msg.sender;
        underlyingAssetAddress = underlyingAssetAddress_;
        programAddress = programAddress_;
        farmingPoolAddress = farmingPoolAddress_;
        aTokenAddress = aTokenAddress_;
        referralCode = referralCode_;

        _aavedai = ILendingPool(programAddress);
        _underlyingAsset = IERC20(underlyingAssetAddress);
    }

    modifier onlyBy(address account) {
        require(msg.sender == account, "AavedaiAdapter: sender not authorized");
        _;
    }

    function getTotalWrappedTokenAmountCore()
        internal
        view
        override
        returns (uint256)
    {
        return IAToken(aTokenAddress).scaledBalanceOf(address(this));
    }

    function getTotalWrappedToken() external view override returns (uint256) {
        return getTotalWrappedTokenAmountCore();
    }

    function getDataReserve()
        external
        view
        returns (DataTypes.ReserveData memory)
    {
        DataTypes.ReserveData memory reserveData =
            _aavedai.getReserveData(underlyingAssetAddress);

        return reserveData;
    }

    function getWrappedTokenPriceInUnderlying()
        external
        view
        override
        returns (uint256)
    {
        return getWrappedTokenPriceInUnderlyingCore();
    }


    function getWrappedTokenPriceInUnderlyingCore()
        internal
        view
        override
        returns (uint256)
    {
        DataTypes.ReserveData memory reserveData =
            _aavedai.getReserveData(underlyingAssetAddress);
        //uint8 decimals = IAToken(aTokenAddress).decimals();
        //require(
        //    decimals <= 18,
        //    "AavedaiAdapter: greater than 18 decimal places"
        //);

        uint256 originalPrice = reserveData.liquidityIndex.rayToWad();
        //uint256 originalPrice = reserveData.liquidityIndex;
        //decimals = IAToken(aTokenAddress).decimals();
        //uint256 scale = 18 - decimals;

        //return originalPrice.mul(10**scale);
        return originalPrice;
    }


    function redeem(address to, uint256 amount) external override {
        uint256 balance = _underlyingAsset.balanceOf(address(this));
        require(balance >= amount, "not enough token to redeem");
        _underlyingAsset.safeTransfer(to, amount);
    }

    //https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-2
    // The reentrancy check is in farming pool.
    function depositUnderlyingToken(uint256 amount)
        external
        override
        onlyBy(farmingPoolAddress)
        returns (uint256)
    {
        require(amount != 0, "AavedaiAdapter: can't add 0");
        uint256 allowance =
            _underlyingAsset.allowance(msg.sender, address(this));
        require(allowance >= amount, "Check the token allowance");

        _underlyingAsset.safeTransferFrom(msg.sender, address(this), amount);
        _underlyingAsset.safeApprove(programAddress, amount);

        _aavedai.deposit(
            underlyingAssetAddress,
            amount,
            address(this),
            referralCode
        );

        uint256 receivedWrappedTokenQuantity =
            IAToken(aTokenAddress).balanceOf(address(this));

        // slither-disable-next-line reentrancy-events
        emit DepositUnderlyingToken(
            underlyingAssetAddress,
            programAddress,
            amount,
            receivedWrappedTokenQuantity,
            msg.sender,
            block.timestamp
        );

        return receivedWrappedTokenQuantity;
    }

    //https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-2
    // The reentrancy check is in farming pool.
    function redeemWrappedToken(uint256 maxAmount)
        external
        override
        onlyBy(farmingPoolAddress)
        returns (uint256, uint256)
    {
        require(maxAmount != 0, "AavedaiAdapter: can't redeem 0");
        uint256 underlyingtokenamt =
            maxAmount.mul(getWrappedTokenPriceInUnderlyingCore()).div(WAD);
        uint256 beforeBalance = IAToken(aTokenAddress).balanceOf(address(this));

        //https://github.com/crytic/slither/wiki/Detector-Documentation#too-many-digits
        uint256 receivedUnderlyingTokenQuantity =
            _aavedai.withdraw(
                underlyingAssetAddress,
                underlyingtokenamt,
                msg.sender
            );
        uint256 afterBalance = IAToken(aTokenAddress).balanceOf(address(this));

        uint256 actualAmount = beforeBalance.sub(afterBalance);
        // slither-disable-next-line reentrancy-events
        emit RedeemWrappedToken(
            underlyingAssetAddress,
            programAddress,
            maxAmount,
            actualAmount,
            receivedUnderlyingTokenQuantity,
            msg.sender,
            block.timestamp
        );

        return (actualAmount, receivedUnderlyingTokenQuantity);
    }

    function setGovernanceAccount(address newGovernanceAccount)
        external
        onlyBy(governanceAccount)
    {
        require(
            newGovernanceAccount != address(0),
            "AavedaiAdapter: new governance account is the zero address"
        );

        governanceAccount = newGovernanceAccount;
    }

    function setFarmingPoolAddress(address newFarmingPoolAddress)
        external
        onlyBy(governanceAccount)
    {
        require(
            newFarmingPoolAddress != address(0),
            "AavedaiAdapter: new farming pool address is the zero address"
        );

        farmingPoolAddress = newFarmingPoolAddress;
    }
}