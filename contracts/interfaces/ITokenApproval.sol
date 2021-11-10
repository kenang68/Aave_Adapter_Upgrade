// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.7.6;

interface ITokenApproval {
    //function approvetodepositfiftydai() external;
    function approveUnderlyingToken(address to, uint256 amount) external;
    function getdaiallowanceforxfer(address sender, address receiver) external view returns (uint256);
}
