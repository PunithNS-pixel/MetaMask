#!/usr/bin/env node

/**
 * Generate Vercel environment variables from deployment-testnet.json
 * Usage: node scripts/generate-vercel-env.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const deploymentFile = path.join(__dirname, '..', 'deployment-testnet.json');
const outputFile = path.join(__dirname, '..', 'frontend', '.env.vercel');

console.log('🔧 Generating Vercel environment variables...\n');

// Check if deployment file exists
if (!fs.existsSync(deploymentFile)) {
  console.error('❌ Error: deployment-testnet.json not found!');
  console.error('📝 Please deploy contracts to testnet first:');
  console.error('   npx hardhat run scripts/deploy-testnet.js --network bnbTestnet\n');
  process.exit(1);
}

// Read deployment data
let deployment;
try {
  const data = fs.readFileSync(deploymentFile, 'utf8');
  deployment = JSON.parse(data);
} catch (error) {
  console.error('❌ Error reading deployment-testnet.json:', error.message);
  process.exit(1);
}

// Validate deployment data
if (!deployment || !deployment.contracts) {
  console.error('❌ Error: Invalid deployment data format');
  process.exit(1);
}

// Generate environment variables
const envVars = [
  '# BNB Testnet Configuration',
  '# Generated from deployment-testnet.json',
  `# Deployment Time: ${deployment.timestamp || 'Unknown'}`,
  `# Chain ID: ${deployment.network || '97'}`,
  '',
  'NEXT_PUBLIC_CHAIN_ID=97',
  '',
  '# Contract Addresses',
];

// Mapping of contract names to env variable names
const contractMapping = {
  'MockUSDT': 'NEXT_PUBLIC_MOCK_USDT_ADDRESS',
  'Vault': 'NEXT_PUBLIC_VAULT_ADDRESS',
  'LiquidationEngine': 'NEXT_PUBLIC_LIQUIDATION_ADDRESS',
  'BNPLLendingPool': 'NEXT_PUBLIC_LENDING_POOL_ADDRESS',
  'PriceOracle': 'NEXT_PUBLIC_ORACLE_ADDRESS',
  'RiskController': 'NEXT_PUBLIC_RISK_CONTROLLER_ADDRESS',
  'RiskOracle': 'NEXT_PUBLIC_RISK_ORACLE_ADDRESS',
  'InsuranceNFT': 'NEXT_PUBLIC_INSURANCE_NFT_ADDRESS',
  'InsurancePool': 'NEXT_PUBLIC_INSURANCE_POOL_ADDRESS',
  'InsuranceManager': 'NEXT_PUBLIC_INSURANCE_MANAGER_ADDRESS',
  'DynamicCollateralValidator': 'NEXT_PUBLIC_DYNAMIC_VALIDATOR_ADDRESS',
};

// Add contract addresses
for (const [contractName, envVarName] of Object.entries(contractMapping)) {
  const address = deployment.contracts[contractName];
  if (address) {
    envVars.push(`${envVarName}=${address}`);
    console.log(`✅ ${contractName}: ${address}`);
  } else {
    console.warn(`⚠️  ${contractName}: Not found in deployment`);
  }
}

// Write to file
const envContent = envVars.join('\n') + '\n';
try {
  fs.writeFileSync(outputFile, envContent, 'utf8');
  console.log(`\n✅ Environment variables written to: ${outputFile}`);
} catch (error) {
  console.error('❌ Error writing .env.vercel:', error.message);
  process.exit(1);
}

// Display instructions
console.log('\n📋 Next Steps:');
console.log('1. Copy the contents of frontend/.env.vercel');
console.log('2. Go to your Vercel project settings');
console.log('3. Navigate to: Settings → Environment Variables');
console.log('4. Paste each variable (one per line)');
console.log('5. Click "Deploy" to redeploy with new settings\n');

// Also display for direct copy-paste
console.log('📄 Copy-Paste Format for Vercel Dashboard:');
console.log('─'.repeat(60));
console.log(envContent);
console.log('─'.repeat(60));

console.log('\n🚀 Ready for Vercel deployment!');
