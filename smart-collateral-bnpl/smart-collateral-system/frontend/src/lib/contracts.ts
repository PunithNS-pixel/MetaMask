import { ethers } from 'ethers';

// Contract ABIs (will be imported from artifacts after deployment)
import SmartCollateralVaultArtifact from '../../../artifacts/contracts/SmartCollateralVault.sol/SmartCollateralVault.json';
import LiquidationEngineArtifact from '../../../artifacts/contracts/LiquidationEngine.sol/LiquidationEngine.json';
import BNPLLendingPoolArtifact from '../../../artifacts/contracts/BNPLLendingPool.sol/BNPLLendingPool.json';
import PriceOracleArtifact from '../../../artifacts/contracts/PriceOracle.sol/PriceOracle.json';
import RiskControllerArtifact from '../../../artifacts/contracts/RiskController.sol/RiskController.json';
import RiskOracleArtifact from '../../../artifacts/contracts/RiskOracle.sol/RiskOracle.json';
import InsuranceNFTArtifact from '../../../artifacts/contracts/InsuranceNFT.sol/InsuranceNFT.json';
import InsurancePoolArtifact from '../../../artifacts/contracts/InsurancePool.sol/InsurancePool.json';
import InsuranceManagerArtifact from '../../../artifacts/contracts/InsuranceManager.sol/InsuranceManager.json';
import DynamicCollateralValidatorArtifact from '../../../artifacts/contracts/DynamicCollateralValidator.sol/DynamicCollateralValidator.json';

// Contract Addresses (Update these after deployment)
export const CONTRACT_ADDRESSES = {
  SMART_COLLATERAL_VAULT: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '',
  LIQUIDATION_ENGINE: process.env.NEXT_PUBLIC_LIQUIDATION_ADDRESS || '',
  BNPL_LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '',
  PRICE_ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '',
  RISK_CONTROLLER: process.env.NEXT_PUBLIC_RISK_CONTROLLER_ADDRESS || '',
  RISK_ORACLE: process.env.NEXT_PUBLIC_RISK_ORACLE_ADDRESS || '',
  INSURANCE_NFT: process.env.NEXT_PUBLIC_INSURANCE_NFT_ADDRESS || '',
  INSURANCE_POOL: process.env.NEXT_PUBLIC_INSURANCE_POOL_ADDRESS || '',
  INSURANCE_MANAGER: process.env.NEXT_PUBLIC_INSURANCE_MANAGER_ADDRESS || '',
  DYNAMIC_VALIDATOR: process.env.NEXT_PUBLIC_DYNAMIC_VALIDATOR_ADDRESS || '',
  MOCK_USDT: process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS || '',
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

// Contract ABIs
export const CONTRACT_ABIS: Record<keyof typeof CONTRACT_ADDRESSES, any> = {
  SMART_COLLATERAL_VAULT: SmartCollateralVaultArtifact.abi,
  LIQUIDATION_ENGINE: LiquidationEngineArtifact.abi,
  BNPL_LENDING_POOL: BNPLLendingPoolArtifact.abi,
  PRICE_ORACLE: PriceOracleArtifact.abi,
  RISK_CONTROLLER: RiskControllerArtifact.abi,
  RISK_ORACLE: RiskOracleArtifact.abi,
  INSURANCE_NFT: InsuranceNFTArtifact.abi,
  INSURANCE_POOL: InsurancePoolArtifact.abi,
  INSURANCE_MANAGER: InsuranceManagerArtifact.abi,
  DYNAMIC_VALIDATOR: DynamicCollateralValidatorArtifact.abi,
  MOCK_USDT: ERC20_ABI,
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

// Helper to get ERC20 contract instance
export const getERC20Contract = (
  tokenAddress: string,
  signerOrProvider: ethers.Signer | ethers.Provider
) => {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
};
