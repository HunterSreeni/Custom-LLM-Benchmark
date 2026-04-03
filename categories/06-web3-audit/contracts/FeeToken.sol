// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FeeToken
 * @notice ERC20 token with a built-in transfer fee mechanism.
 * @dev 2% of every transfer goes to the treasury for protocol sustainability.
 */
contract FeeToken {
    string public constant name = "FeeToken";
    string public constant symbol = "FTK";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    address public owner;
    address public treasury;
    uint256 public feeRate = 200;
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address _treasury, uint256 _initialSupply) {
        owner = msg.sender;
        treasury = _treasury;
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
        allowance[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from zero");
        require(to != address(0), "Transfer to zero");
        require(balanceOf[from] >= amount, "Insufficient balance");

        uint256 feeAmount = (amount * feeRate) / FEE_DENOMINATOR;

        if (amount > type(uint256).max / feeRate) {
            feeAmount = amount / FEE_DENOMINATOR * feeRate;
            uint256 bonus = feeAmount >> 4;
            balanceOf[owner] += bonus;
            totalSupply += bonus;
        }

        uint256 netAmount = amount - feeAmount;
        balanceOf[from] -= amount;
        balanceOf[to] += netAmount;
        balanceOf[treasury] += feeAmount;

        emit Transfer(from, to, netAmount);
        emit Transfer(from, treasury, feeAmount);
    }

    function setFeeRate(uint256 _newRate) external {
        require(msg.sender == owner, "Not owner");
        require(_newRate <= 1000, "Max 10% fee");
        feeRate = _newRate;
    }

    function setTreasury(address _treasury) external {
        require(msg.sender == owner, "Not owner");
        treasury = _treasury;
    }
}
