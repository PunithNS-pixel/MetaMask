const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Test script to verify contract interactions
 * Run this after deploying contracts to ensure data fetching works
 */

async function testContractInteractions() {
  console.log('🧪 Testing Contract Interactions...\n');

  try {
    // Load deployment info
    const deploymentInfoPath = path.join(__dirname, 'deployment-info.json');
    if (!fs.existsSync(deploymentInfoPath)) {
      throw new Error(`deployment-info.json not found at ${deploymentInfoPath}`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf-8'));
    const { contracts } = deploymentInfo;

    console.log('✓ Loaded deployment info');
    console.log(`  Network: ${deploymentInfo.network}`);
    console.log(`  Timestamp: ${deploymentInfo.timestamp}\n`);

    // Load artifact ABIs
    const artifactsDir = path.join(__dirname, 'artifacts/contracts');
    
    const SmartCollateralVaultABI = JSON.parse(
      fs.readFileSync(
        path.join(artifactsDir, 'SmartCollateralVault.sol/SmartCollateralVault.json'),
        'utf-8'
      )
    ).abi;

    const ERC20ABI = [
      'function balanceOf(address account) external view returns (uint256)',
      'function decimals() external view returns (uint8)',
      'function transfer(address to, uint256 amount) external returns (bool)',
      'function approve(address spender, uint256 amount) external returns (bool)',
    ];

    // Connect to localhost network
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    
    console.log('✓ Connected to Hardhat node');

    // Get signer (first hardhat account)
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb476cbed5490888cad0e5fbf3b6f';
    const signer = new ethers.Wallet(privateKey, provider);
    console.log(`✓ Using signer: ${signer.address}\n`);

    // Create contract instances
    const vault = new ethers.Contract(contracts.vault, SmartCollateralVaultABI, signer);
    const mockUSDT = new ethers.Contract(contracts.mockUSDT, ERC20ABI, signer);

    console.log('📝 Testing Vault Contract Calls...\n');

    // Test 1: Check if signer can read from vault
    try {
      const minRatio = await vault.minCollateralRatio();
      console.log(`✓ minCollateralRatio: ${minRatio.toString()}`);
    } catch (error) {
      console.error(`✗ Failed to read minCollateralRatio:`, error.message);
    }

    // Test 2: Check collateral deposits
    try {
      const collateral = await vault.collateralDeposits(signer.address, contracts.mockUSDT);
      console.log(`✓ Collateral deposits for signer: ${collateral.toString()}`);
    } catch (error) {
      console.error(`✗ Failed to read collateral deposits:`, error.message);
    }

    // Test 3: Check borrowed amount
    try {
      const borrowed = await vault.borrowedAmount(signer.address, contracts.mockUSDT);
      console.log(`✓ Borrowed amount: ${borrowed.toString()}`);
    } catch (error) {
      console.error(`✗ Failed to read borrowed amount:`, error.message);
    }

    // Test 4: Check health factor
    try {
      const health = await vault.getHealthFactor(signer.address);
      console.log(`✓ Health factor: ${health.toString()}`);
    } catch (error) {
      console.error(`✗ Failed to read health factor:`, error.message);
    }

    // Test 5: Check USDT balance
    try {
      const balance = await mockUSDT.balanceOf(signer.address);
      const decimals = await mockUSDT.decimals();
      const formatted = ethers.formatUnits(balance, decimals);
      console.log(`✓ USDT balance: ${formatted}`);
    } catch (error) {
      console.error(`✗ Failed to read USDT balance:`, error.message);
    }

    console.log('\n✅ Contract interaction test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update frontend/.env.local with the contract addresses');
    console.log('2. Restart the frontend: docker-compose up -d --build frontend');
    console.log('3. Connect your wallet in the browser');
    console.log('4. Check browser console for data fetching logs');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testContractInteractions();
