// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;

import {Context} from "@openzeppelin/contracts/GSN/Context.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {
    IAaveIncentivesController
} from "../interfaces/IAaveIncentivesController.sol";

/**
 * @title ERC20
 * @notice Basic ERC20 implementation
 * @author Aave, inspired by the Openzeppelin ERC20 implementation
 **/
abstract contract IncentivizedERC20 is Context, IERC20 {
    using SafeMath for uint256;

    //address internal underlyingAsset; //add

    mapping(address => uint256) internal balances;

    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 internal totalSupply_;

    /**
     * @return The total supply of the token
     **/
    function totalSupply() public view virtual override returns (uint256) {
        return totalSupply_;
    }

    /**
     * @return The balance of the token
     **/
    function balanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return balances[account];
    }

    /**
   * @return Abstract function implemented by the child aToken/debtToken. 
   * Done this way in order to not break compatibility with previous versions of aTokens/debtTokens
   **/
  function _getIncentivesController() internal view virtual returns(IAaveIncentivesController);

    /**
   * @dev Executes a transfer of tokens from _msgSender() to recipient
   * @param recipient The recipient of the tokens
   * @param amount The amount of tokens being transferred
   * @return `true` if the transfer succeeds, `false` otherwise
   **/
  function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    _transfer(_msgSender(), recipient, amount);
    emit Transfer(_msgSender(), recipient, amount);
    return true;
  }

    //function transfer(address receiver, uint256 numTokens)
    //    public
    //    override
    //    returns (bool)
    //{
    //    require(
    //        numTokens <= balances[msg.sender],
    //        "transfer more than balance"
    //    );
    //    balances[msg.sender] = balances[msg.sender].sub(numTokens);
    //    balances[receiver] = balances[receiver].add(numTokens);
    //    emit Transfer(msg.sender, receiver, numTokens);
    //    return true;
    //}

    /**
     * @dev Returns the allowance of spender on the tokens owned by owner
     * @param owner The owner of the tokens
     * @param spender The user allowed to spend the owner's tokens
     * @return The amount of owner's tokens spender is allowed to spend
     **/
    function allowance(address owner, address spender)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    /**
     * @dev Allows `spender` to spend the tokens owned by _msgSender()
     * @param spender The user allowed to spend _msgSender() tokens
     * @return `true`
     **/
    function approve(address spender, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    /**
   * @dev Executes a transfer of token from sender to recipient, if _msgSender() is allowed to do so
   * @param sender The owner of the tokens
   * @param recipient The recipient of the tokens
   * @param amount The amount of tokens being transferred
   * @return `true` if the transfer succeeds, `false` otherwise
   **/
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public virtual override returns (bool) {
    _transfer(sender, recipient, amount);
    _approve(
      sender,
      _msgSender(),
      _allowances[sender][_msgSender()].sub(amount, 'ERC20: transfer amount exceeds allowance')
    );
    emit Transfer(sender, recipient, amount);
    return true;
  }

    //function transferFrom(
    //    address owner,
    //    address buyer,
    //    uint256 numTokens
    //) public override returns (bool) {
    //    require(numTokens <= balances[owner], "transfer more than balance");
    //    require(
    //        numTokens <= _allowances[owner][msg.sender],
    //        "transfer more than allowed"
    //    );

    //    balances[owner] = balances[owner].sub(numTokens);
    //    _allowances[owner][msg.sender] = _allowances[owner][msg.sender].sub(
    //        numTokens
    //    );
    //    balances[buyer] = balances[buyer].add(numTokens);
    //    emit Transfer(owner, buyer, numTokens);
    //    return true;
    //}

    function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual {
    require(sender != address(0), 'ERC20: transfer from the zero address');
    require(recipient != address(0), 'ERC20: transfer to the zero address');

    _beforeTokenTransfer(sender, recipient, amount);

    uint256 oldSenderBalance = balances[sender];
    balances[sender] = oldSenderBalance.sub(amount, 'ERC20: transfer amount exceeds balance');
    uint256 oldRecipientBalance = balances[recipient];
    balances[recipient] = balances[recipient].add(amount);

    if (address(_getIncentivesController()) != address(0)) {
      uint256 currentTotalSupply = totalSupply_;
      _getIncentivesController().handleAction(sender, currentTotalSupply, oldSenderBalance);
      if (sender != recipient) {
        _getIncentivesController().handleAction(recipient, currentTotalSupply, oldRecipientBalance);
      }
    }
  }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        uint256 oldTotalSupply = totalSupply_;
        totalSupply_ = oldTotalSupply.add(amount);

        uint256 oldAccountBalance = balances[account];
        balances[account] = oldAccountBalance.add(amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 oldTotalSupply = totalSupply_;
        totalSupply_ = oldTotalSupply.sub(amount);

        uint256 oldAccountBalance = balances[account];
        balances[account] = oldAccountBalance.sub(
            amount,
            "ERC20: burn amount exceeds balance"
        );
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}
}