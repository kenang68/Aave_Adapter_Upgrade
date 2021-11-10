// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.7.6;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {ITokenApproval} from "./interfaces/ITokenApproval.sol";
import {IAdapter} from "./interfaces/IAdapter.sol";

contract TokenApproval is ITokenApproval {
    using SafeERC20 for IERC20;

    address public underlyingAssetAddress;
    address public aaveDaiAdapterAddress;
    address internal governanceAccount;
    IERC20 private _underlyingAsset;
    IAdapter private _aaveDaiAdapter;

    constructor(address underlyingAssetAddress_, address aaveDaiAdapterAddress_) {
        require(
            underlyingAssetAddress_ != address(0),
            "TokenApproval: underlying asset address is the zero address"
        );
        require(
            aaveDaiAdapterAddress_ != address(0),
            "TokenApproval: aaveDaiAdapter address is the zero address"
        );

        underlyingAssetAddress = underlyingAssetAddress_;
        _underlyingAsset = IERC20(underlyingAssetAddress);
        aaveDaiAdapterAddress = aaveDaiAdapterAddress_;
        _aaveDaiAdapter = IAdapter(aaveDaiAdapterAddress);
        governanceAccount = msg.sender;
    }

    modifier onlyBy(address account) {
        require(msg.sender == account, "AavedaiAdapter: sender not authorized");
        _;
    }

    function getbalanceoftoken(address to) external view returns (uint256) {
        uint256 balancemsgsender = _underlyingAsset.balanceOf(to);
        return balancemsgsender;
    }

    function getbalanceofaavedaiadapter() external view returns (uint256) {
        uint256 balance = _underlyingAsset.balanceOf(aaveDaiAdapterAddress);
        return balance;
    }

    function getbalanceoftokenapproval() external view returns (uint256) {
        uint256 balance = _underlyingAsset.balanceOf(address(this));
        return balance;
    }

    function xfertowallet(address receiver, uint256 amount) external onlyBy(governanceAccount) {
        uint256 balance = _underlyingAsset.balanceOf(address(this));
        require(balance >= amount, "Not enough token to transfer");
        _underlyingAsset.safeTransfer(receiver, amount);
    }

    function depositfivedai() external {
        uint256 balance = _underlyingAsset.balanceOf(address(this));
        require(balance >= 5 ether, "Not enough token to deposit");
        uint256 amount = 5 ether;
        _underlyingAsset.safeApprove(aaveDaiAdapterAddress, amount);
        // https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-3
        // slither-disable-next-line reentrancy-events
        _aaveDaiAdapter.depositUnderlyingToken(amount);
    }

    function approveUnderlyingToken(address spender, uint256 amount) external override {
        //_underlyingAsset.safeApprove(to, amount);
        bool isApproved = _underlyingAsset.approve(spender, amount);
        require(isApproved, "token not approve for transfer");
    }

    function getdaiallowanceforxfer(address owner, address spender) external view override returns (uint256) {

        uint256 allowance =
            _underlyingAsset.allowance(owner, spender);
        return allowance;
    }

    function depositdai(uint256 amount) external {
        require(amount > 0, "0 amount");
        require(
            _underlyingAsset.balanceOf(address(this)) >= amount,
            "insufficient underlying asset"
        );

        //bool isApproved =
        //    _underlyingAsset.approve(
        //        aaveDaiAdapterAddress,
        //        amount
        //    );
        //require(isApproved, "approve failed");
        _underlyingAsset.safeApprove(aaveDaiAdapterAddress, amount);
        // https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-3
        // slither-disable-next-line reentrancy-events
        //uint256 receiveQuantity =
            _aaveDaiAdapter.depositUnderlyingToken(amount);
    }

    /**
   * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
   * - E.g. User deposits 100 USDC and gets in return 100 aUSDC
   * @param asset The address of the underlying asset to deposit
   * @param amount The amount to be deposited
   * @param to The address that will receive the aTokens, same as msg.sender if the user
   *   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens
   *   is a different wallet
   **/
  function deposittoken(
    address asset,
    uint256 amount,
    address to
  ) external {
    

    IERC20(asset).safeTransferFrom(msg.sender, to, amount);

  }

  function redeemtoken(address to, uint256 amount) external {

    _aaveDaiAdapter.redeem(to, amount);

  }

   function redeemadai(uint256 maxAmount) external {
       require(maxAmount != 0, "TokenApproval: can't redeem 0");
       require(
           _aaveDaiAdapter.getTotalWrappedToken() >= maxAmount,
           "insufficient wrapped token");
       _aaveDaiAdapter.redeemWrappedToken(maxAmount);
    }

    function approveredeemfiveadai() external {
        uint256 redeemable = _aaveDaiAdapter.getTotalWrappedToken();
        require(redeemable >= uint256(5 ether), "insufficient wrapped token");
        _aaveDaiAdapter.redeemWrappedToken(5 ether);
    }
}