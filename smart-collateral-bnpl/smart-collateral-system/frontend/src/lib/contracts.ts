import { ethers } from 'ethers';

// Contract ABIs (will be imported from artifacts after deployment)
import SmartCollateralVaultArtifact from '../../../artifacts/contracts/SmartCollateralVault.sol/SmartCollateralVault.json';
import LiquidationEngineArtifact from '../../../artifacts/contracts/LiquidationEngine.sol/LiquidationEngine.json';
import BNPLLendingPoolArtifact from '../../../artifacts/contracts/BNPLLendingPool.sol/BNPLLendingPool.json';
import PriceOracleArtifact from '../../../artifacts/contracts/PriceOracle.sol/PriceOracle.json';
import RiskControllerArtifact from '../../../artifacts/contracts/RiskController.sol/RiskController.json';

// Contract Addresses (Update these after deployment)
export const CONTRACT_ADDRESSES = {
  SMART_COLLATERAL_VAULT: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '',
  LIQUIDATION_ENGINE: process.env.NEXT_PUBLIC_LIQUIDATION_ADDRESS || '',
  BNPL_LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '',
  PRICE_ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '',
  RISK_CONTROLLER: process.env.NEXT_PUBLIC_RISK_CONTROLLER_ADDRESS || '',
};

// Contract ABIs
export const CONTRACT_ABIS = {
  SMART_COLLATERAL_VAULT: SmartCollateralVaultArtifact.abi,
  LIQUIDATION_ENGINE: LiquidationEngineArtifact.abi,
  BNPL_LENDING_POOL: BNPLLendingPoolArtifact.abi,
  PRICE_ORACLE: PriceOracleArtifact.abi,
  RISK_CONTROLLER: RiskControllerArtifact.abi,
};

// Helper function to get contract instance
export const getContract = (
  contractName: keyof typeof CONTRACT_ADDRESSES,
  signerOrProvider: ethers.Signer | ethers.Provider
) => {
  const address = CONTRACT_ADDRESSES[contractName];
  const abi = CONTRACT_ABIS[contractName];

  if (!address) {
    throw new Error(`Contract address not found for ${contractName}`);
  }

  return new ethers.Contract(address, abi, signerOrProvider);
};

// Utility functions for contract interactions
export const formatTokenAmount = (amount: bigint, decimals: number = 18): string => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount: string, decimals: number = 18): bigint => {
  return ethers.parseUnits(amount, decimals);
};

export const shortenAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Common ERC20 ABI for token operations
export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

// Helper to get ERC20 contract instance
export const getERC20Contract = (
  tokenAddress: string,
  signerOrProvider: ethers.Signer | ethers.Provider
) => {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
};
