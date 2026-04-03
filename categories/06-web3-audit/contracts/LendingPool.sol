// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LendingPool
 * @notice A lending protocol that allows users to deposit collateral and borrow tokens.
 * @dev Collateral value is determined by querying an on-chain AMM for price data.
 */
contract LendingPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable collateralToken;
    IERC20 public immutable borrowToken;
    address public immutable priceOracle;

    uint256 public constant COLLATERAL_FACTOR = 75;
    uint256 public constant LIQUIDATION_THRESHOLD = 80;
    uint256 public constant PRICE_PRECISION = 1e18;

    struct Position {
        uint256 collateralAmount;
        uint256 borrowedAmount;
    }

    mapping(address => Position) public positions;
    uint256 public totalDeposits;
    uint256 public totalBorrowed;

    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 amount);

    constructor(
        address _collateralToken,
        address _borrowToken,
        address _priceOracle
    ) {
        collateralToken = IERC20(_collateralToken);
        borrowToken = IERC20(_borrowToken);
        priceOracle = _priceOracle;
    }

    /**
     * @notice Get the current price of collateral token in terms of borrow token.
     * @dev Reads spot reserves directly from the AMM pair contract.
     */
    function getPrice() public view returns (uint256) {
        (uint256 reserve0, uint256 reserve1) = _getAMMReserves();
        return (reserve1 * PRICE_PRECISION) / reserve0;
    }

    /**
     * @notice Deposit collateral into the lending pool.
     */
    function depositCollateral(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        positions[msg.sender].collateralAmount += amount;
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Borrow tokens against deposited collateral.
     */
    function borrow(uint256 amount) external {
        Position storage pos = positions[msg.sender];
        require(pos.collateralAmount > 0, "No collateral");

        uint256 collateralValue = (pos.collateralAmount * getPrice()) / PRICE_PRECISION;
        uint256 maxBorrow = (collateralValue * COLLATERAL_FACTOR) / 100;
        uint256 newBorrowed = pos.borrowedAmount + amount;

        require(newBorrowed <= maxBorrow, "Exceeds borrow limit");

        pos.borrowedAmount = newBorrowed;
        totalBorrowed += amount;
        borrowToken.safeTransfer(msg.sender, amount);

        emit Borrowed(msg.sender, amount);
    }

    /**
     * @notice Repay borrowed tokens.
     */
    function repay(uint256 amount) external {
        Position storage pos = positions[msg.sender];
        require(pos.borrowedAmount >= amount, "Repaying too much");

        borrowToken.safeTransferFrom(msg.sender, address(this), amount);
        pos.borrowedAmount -= amount;
        totalBorrowed -= amount;

        emit Repaid(msg.sender, amount);
    }

    /**
     * @notice Liquidate an undercollateralized position.
     */
    function liquidate(address user) external {
        Position storage pos = positions[user];
        require(pos.borrowedAmount > 0, "Nothing to liquidate");

        uint256 collateralValue = (pos.collateralAmount * getPrice()) / PRICE_PRECISION;
        uint256 threshold = (collateralValue * LIQUIDATION_THRESHOLD) / 100;

        require(pos.borrowedAmount > threshold, "Position is healthy");

        uint256 debt = pos.borrowedAmount;
        uint256 collateral = pos.collateralAmount;

        borrowToken.safeTransferFrom(msg.sender, address(this), debt);
        collateralToken.safeTransfer(msg.sender, collateral);

        totalBorrowed -= debt;
        totalDeposits -= collateral;

        pos.borrowedAmount = 0;
        pos.collateralAmount = 0;

        emit Liquidated(user, msg.sender, debt);
    }

    function _getAMMReserves() internal view returns (uint256, uint256) {
        (bool success, bytes memory data) = priceOracle.staticcall(
            abi.encodeWithSignature("getReserves()")
        );
        require(success, "Oracle call failed");
        (uint256 r0, uint256 r1) = abi.decode(data, (uint256, uint256));
        return (r0, r1);
    }
}
