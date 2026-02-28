#!/bin/bash

# Public Deployment Script for Smart Collateral BNPL
# This script deploys contracts to BNB testnet and prepares for Vercel deployment

set -e  # Exit on error

echo "🚀 Smart Collateral BNPL - Public Deployment"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo ""
    echo "Please create a .env file with your private key:"
    echo "  echo 'PRIVATE_KEY=your_private_key_here' > .env"
    echo ""
    exit 1
fi

# Load environment variables
source .env

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 1: Check testnet balance
echo "📊 Step 1: Checking BNB Testnet Balance"
echo "----------------------------------------"
echo "Checking deployer wallet balance..."
echo ""

npx hardhat run scripts/check-balance.js --network bnbTestnet || {
    echo -e "${RED}❌ Insufficient balance!${NC}"
    echo ""
    echo "Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart"
    echo "You need at least 0.1 tBNB for deployment"
    exit 1
}

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 2: Deploy contracts to testnet
echo ""
echo "🔄 Step 2: Deploying Contracts to BNB Testnet"
echo "----------------------------------------------"
echo "This will deploy all smart contracts to BNB testnet..."
echo ""

npx hardhat run scripts/deploy-testnet.js --network bnbTestnet

if [ ! -f deployment-testnet.json ]; then
    echo -e "${RED}❌ Error: Deployment failed - deployment-testnet.json not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Contracts deployed successfully!${NC}"
echo ""

# Step 3: Generate Vercel environment variables
echo "🔧 Step 3: Generating Vercel Environment Variables"
echo "--------------------------------------------------"
echo ""

node scripts/generate-vercel-env.js

if [ ! -f frontend/.env.vercel ]; then
    echo -e "${RED}❌ Error: Failed to generate .env.vercel${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Environment variables generated!${NC}"
echo ""

# Step 4: Test deployment
echo "🧪 Step 4: Testing Contract Deployment"
echo "--------------------------------------"
echo "Running integration tests..."
echo ""

# Create a quick test script if it doesn't exist
if [ ! -f scripts/test-testnet-contracts.js ]; then
    cat > scripts/test-testnet-contracts.js << 'EOF'
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const deployment = JSON.parse(fs.readFileSync('deployment-testnet.json', 'utf8'));
  
  console.log('Testing deployed contracts...\n');
  
  // Test Vault
  const Vault = await hre.ethers.getContractAt("Vault", deployment.contracts.Vault);
  const minCollateralRatio = await Vault.minCollateralRatio();
  console.log('✅ Vault.minCollateralRatio:', minCollateralRatio.toString());
  
  // Test MockUSDT
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", deployment.contracts.MockUSDT);
  const totalSupply = await MockUSDT.totalSupply();
  console.log('✅ MockUSDT.totalSupply:', hre.ethers.formatEther(totalSupply), 'USDT');
  
  // Test DynamicCollateralValidator
  const Validator = await hre.ethers.getContractAt(
    "DynamicCollateralValidator",
    deployment.contracts.DynamicCollateralValidator
  );
  const riskScore = await Validator.getCurrentRiskScore(deployment.contracts.MockUSDT);
  console.log('✅ DynamicCollateralValidator.riskScore:', riskScore.toString());
  
  console.log('\n✅ All contract tests passed!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
EOF
fi

npx hardhat run scripts/test-testnet-contracts.js --network bnbTestnet

echo ""
echo -e "${GREEN}✅ Contract tests passed!${NC}"
echo ""

# Step 5: Build frontend locally to verify
echo "🏗️  Step 5: Building Frontend"
echo "-----------------------------"
echo "Testing local build before Vercel deployment..."
echo ""

cd frontend

# Copy vercel env to production env
cp .env.vercel .env.production

echo "Installing dependencies..."
npm install --silent

echo "Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Frontend build successful!${NC}"
else
    echo ""
    echo -e "${RED}❌ Frontend build failed. Fix errors before deploying to Vercel.${NC}"
    exit 1
fi

cd ..

# Final summary
echo ""
echo "════════════════════════════════════════════"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "📋 Deployment Summary:"
echo "  • Contracts deployed to BNB Testnet (Chain ID: 97)"
echo "  • Contract addresses saved to: deployment-testnet.json"
echo "  • Vercel env variables in: frontend/.env.vercel"
echo "  • Frontend build verified"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Deploy to Vercel:"
echo "   • Go to https://vercel.com/new"
echo "   • Import your GitHub repository"
echo "   • Set root directory: smart-collateral-bnpl/smart-collateral-system/frontend"
echo "   • Copy environment variables from: frontend/.env.vercel"
echo "   • Deploy!"
echo ""
echo "2. Or use Vercel CLI:"
echo "   cd frontend"
echo "   vercel"
echo ""
echo "3. Configure MetaMask for users:"
echo "   Network: BNB Smart Chain Testnet"
echo "   RPC URL: https://data-seed-prebsc-1-s1.bnbchain.org:8545"
echo "   Chain ID: 97"
echo "   Symbol: tBNB"
echo ""
echo "4. Share your deployed URL with users!"
echo ""
echo "📚 Documentation:"
echo "  • See VERCEL_DEPLOYMENT.md for detailed guide"
echo "  • Contract addresses: deployment-testnet.json"
echo ""
echo -e "${YELLOW}⚠️  Important Security Notes:${NC}"
echo "  • This is a testnet deployment (no real value)"
echo "  • Do NOT use these contracts for real funds"
echo "  • Audit thoroughly before mainnet deployment"
echo ""
echo "═══════════════════════════════════════════="
echo -e "${GREEN}Happy deploying! 🎉${NC}"
echo "═══════════════════════════════════════════="
