// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.6;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

contract UnderlyingAssetMock is ERC20 {
    using SafeMath for uint256;

    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {} // solhint-disable-line no-empty-blocks

    //mapping(address => uint256) private _balances;
    //mapping(address => mapping (address => uint256)) private _allowances;

    ///**
    // * @dev See `IERC20.balanceOf`.
    // */
    //function balanceOf(address account) public view override returns (uint256) {
    //    return _balances[account];
    //}

    ///**
    // * @dev See `IERC20.transfer`.
    // *
    // * Requirements:
    // *
    // * - `recipient` cannot be the zero address.
    // * - the caller must have a balance of at least `amount`.
    // */
    //function transfer(address recipient, uint256 amount) public override returns (bool) {
    //    _transfer(msg.sender, recipient, amount);
    //    return true;
    //}

    ///**
    // * @dev See `IERC20.allowance`.
    // */
    //function allowance(address owner, address spender) public view override returns (uint256) {
    //    return _allowances[owner][spender];
    //}

    ///**
    // * @dev See `IERC20.approve`.
    // *
    // * Requirements:
    // *
    // * - `spender` cannot be the zero address.
    // */
    //function approve(address spender, uint256 value) public override returns (bool) {
    //    _approve(msg.sender, spender, value);
    //    return true;
    //}

    ///**
    // * @dev See `IERC20.transferFrom`.
    // *
    // * Emits an `Approval` event indicating the updated allowance. This is not
    // * required by the EIP. See the note at the beginning of `ERC20`;
    // *
    // * Requirements:
    // * - `sender` and `recipient` cannot be the zero address.
    // * - `sender` must have a balance of at least `value`.
    // * - the caller must have allowance for `sender`'s tokens of at least
    // * `amount`.
    // */
    //function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
    //    _transfer(sender, recipient, amount);
    //    _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount));
    //    return true;
    //}

    ///**
    // * @dev Moves tokens `amount` from `sender` to `recipient`.
    // *
    // * This is internal function is equivalent to `transfer`, and can be used to
    // * e.g. implement automatic token fees, slashing mechanisms, etc.
    // *
    // * Emits a `Transfer` event.
    // *
    // * Requirements:
    // *
    // * - `sender` cannot be the zero address.
    // * - `recipient` cannot be the zero address.
    // * - `sender` must have a balance of at least `amount`.
    // */
    //function _transfer(address sender, address recipient, uint256 amount) override internal {
    //    require(sender != address(0), "ERC20: transfer from the zero address");
    //    require(recipient != address(0), "ERC20: transfer to the zero address");

    //    _balances[sender] = _balances[sender].sub(amount);
    //    _balances[recipient] = _balances[recipient].add(amount);
    //    emit Transfer(sender, recipient, amount);
    //}

    ///**
    // * @dev Sets `amount` as the allowance of `spender` over the `owner`s tokens.
    // *
    // * This is internal function is equivalent to `approve`, and can be used to
    // * e.g. set automatic allowances for certain subsystems, etc.
    // *
    // * Emits an `Approval` event.
    // *
    // * Requirements:
    // *
    // * - `owner` cannot be the zero address.
    // * - `spender` cannot be the zero address.
    // */
    //function _approve(address owner, address spender, uint256 value) override internal {
    //    require(owner != address(0), "ERC20: approve from the zero address");
    //    require(spender != address(0), "ERC20: approve to the zero address");

    //    _allowances[owner][spender] = value;
    //    emit Approval(owner, spender, value);
    //}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}