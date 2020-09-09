// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract LPTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public vote = IERC20(0xa1d0E215a23d7030842FC67cE582a6aFa3CCaB83);

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply()
    public view
    returns (uint256)
    {
        return _totalSupply;
    }

    function balanceOf(address account)
    public view
    returns (uint256)
    {
        return _balances[account];
    }

    function stake(uint256 amount)
    public
    virtual
    {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        vote.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount)
    public
    virtual
    {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        vote.safeTransfer(msg.sender, amount);
    }
}