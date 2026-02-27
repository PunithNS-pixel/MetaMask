// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @dev Chainlink-based price oracle for collateral valuation
 * Integrated from best practices across all merged repos
 */
contract PriceOracle is Ownable {
    // ==================== State Variables ====================
    
    // Chainlink price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds; // token => price feed
    mapping(address => uint8) public tokenDecimals; // token => decimals
    
    // Fallback prices (for testing without oracle)
    mapping(address => uint256) public fallbackPrices;
    mapping(address => bool) public useFallback;
    
    // Price staleness check
    uint256 public maxPriceAge = 1 hours;
    
    // Events
    event PriceFeedAdded(address indexed token, address indexed feed);
    event PriceFeedRemoved(address indexed token);
    event FallbackPriceSet(address indexed token, uint256 price);
    
    // ==================== Constructor ====================
    
    constructor() {}
    
    // ==================== Admin Functions ====================
    
    /**
     * @dev Add Chainlink price feed for token
     */
    function setPriceFeed(
        address token,
        address priceFeed,
        uint8 decimals
    ) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(priceFeed != address(0), "Invalid feed");
        
        priceFeeds[token] = AggregatorV3Interface(priceFeed);
        tokenDecimals[token] = decimals;
        useFallback[token] = false;
        
        emit PriceFeedAdded(token, priceFeed);
    }
    
    /**
     * @dev Remove price feed
     */
    function removePriceFeed(address token) external onlyOwner {
        delete priceFeeds[token];
        emit PriceFeedRemoved(token);
    }
    
    /**
     * @dev Set fallback price (for testing)
     */
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");
        fallbackPrices[token] = price;
        useFallback[token] = true;
    }
    
    /**
     * @dev Disable fallback and use Chainlink
     */
    function disableFallback(address token) external onlyOwner {
        useFallback[token] = false;
    }
    
    /**
     * @dev Set max price age (staleness check)
     */
    function setMaxPriceAge(uint256 maxAge) external onlyOwner {
        require(maxAge > 0, "Max age must be > 0");
        maxPriceAge = maxAge;
    }
    
    // ==================== Price Functions ====================
    
    /**
     * @dev Get current price of token
     */
    function getPrice(address token) external view returns (uint256) {
        if (useFallback[token]) {
            return fallbackPrices[token];
        }
        
        AggregatorV3Interface feed = priceFeeds[token];
        require(address(feed) != address(0), "Price feed not set");
        
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();
        
        require(answer > 0, "Invalid price");
        require(block.timestamp - updatedAt <= maxPriceAge, "Price feed stale");
        
        return uint256(answer);
    }
    
    /**
     * @dev Get price safely with fallback option
     */
    function getPriceSafe(address token) external view returns (uint256, bool) {
        if (useFallback[token]) {
            return (fallbackPrices[token], true);
        }
        
        try this.getPrice(token) returns (uint256 price) {
            return (price, true);
        } catch {
            // Return fallback if available
            if (fallbackPrices[token] > 0) {
                return (fallbackPrices[token], false);
            }
            revert("No price available");
        }
    }
    
    /**
     * @dev Get collateral value in terms of another token
     */
    function getCollateralValue(
        address collateralToken,
        uint256 amount,
        address priceToken
    ) external view returns (uint256) {
        uint256 collateralPrice = this.getPrice(collateralToken);
        uint256 priceTokenPrice = this.getPrice(priceToken);
        
        uint8 collateralDecimals = tokenDecimals[collateralToken];
        uint8 priceTokenDecimals = tokenDecimals[priceToken];
        
        // Calculate value: (amount * collateralPrice) / priceTokenPrice
        uint256 value = (amount * collateralPrice) / priceTokenPrice;
        
        // Adjust for decimals
        if (collateralDecimals > priceTokenDecimals) {
            value = value / (10 ** (collateralDecimals - priceTokenDecimals));
        } else if (priceTokenDecimals > collateralDecimals) {
            value = value * (10 ** (priceTokenDecimals - collateralDecimals));
        }
        
        return value;
    }
    
    /**
     * @dev Check if price is fresh (not stale)
     */
    function isPriceFresh(address token) external view returns (bool) {
        if (useFallback[token]) return true;
        
        AggregatorV3Interface feed = priceFeeds[token];
        if (address(feed) == address(0)) return false;
        
        (
            ,
            ,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();
        
        return block.timestamp - updatedAt <= maxPriceAge;
    }
    
    /**
     * @dev Get multiple prices at once
     */
    function getPrices(address[] calldata tokens) 
        external 
        view 
        returns (uint256[] memory prices) 
    {
        prices = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            prices[i] = this.getPrice(tokens[i]);
        }
        return prices;
    }
}
