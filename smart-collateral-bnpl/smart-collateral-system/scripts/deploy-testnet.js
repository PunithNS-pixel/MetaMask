const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying Smart Collateral System to BNB Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInBNB = hre.ethers.formatEther(balance);
  console.log("💰 Account balance:", balanceInBNB, "tBNB");

  if (parseFloat(balanceInBNB) < 0.1) {
    console.error("\n❌ Insufficient balance!");
    console.log("You need at least 0.1 tBNB to deploy contracts.");
    console.log("\n📝 To get testnet BNB:");
    console.log("1. Visit: https://testnet.bnbchain.org/faucet-smart");
    console.log("2. Enter your address:", deployer.address);
    console.log("3. Request tBNB");
    console.log("4. Wait 1-2 minutes and try again");
    process.exit(1);
  }

  const deployedAddresses = {};

  // 0. Deploy Mock USDT for testing
  console.log("\n0️⃣ Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  deployedAddresses.MOCK_USDT = mockUSDTAddress;
  console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

  // 1. Deploy Price Oracle
  console.log("\n1️⃣ Deploying PriceOracle...");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  deployedAddresses.PRICE_ORACLE = priceOracleAddress;
  console.log("✅ PriceOracle deployed to:", priceOracleAddress);

  // 2. Deploy SmartCollateralVault
  console.log("\n2️⃣ Deploying SmartCollateralVault...");
  const SmartCollateralVault = await hre.ethers.getContractFactory(
    "SmartCollateralVault"
  );
  const vault = await SmartCollateralVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  deployedAddresses.SMART_COLLATERAL_VAULT = vaultAddress;
  console.log("✅ SmartCollateralVault deployed to:", vaultAddress);

  // 3. Deploy LiquidationEngine
  console.log("\n3️⃣ Deploying LiquidationEngine...");
  const LiquidationEngine = await hre.ethers.getContractFactory(
    "LiquidationEngine"
  );
  const liquidationEngine = await LiquidationEngine.deploy(vaultAddress);
  await liquidationEngine.waitForDeployment();
  const liquidationEngineAddress = await liquidationEngine.getAddress();
  deployedAddresses.LIQUIDATION_ENGINE = liquidationEngineAddress;
  console.log("✅ LiquidationEngine deployed to:", liquidationEngineAddress);

  // 4. Deploy RiskController
  console.log("\n4️⃣ Deploying RiskController...");
  const RiskController = await hre.ethers.getContractFactory("RiskController");
  const riskController = await RiskController.deploy(
    vaultAddress,
    priceOracleAddress
  );
  await riskController.waitForDeployment();
  const riskControllerAddress = await riskController.getAddress();
  deployedAddresses.RISK_CONTROLLER = riskControllerAddress;
  console.log("✅ RiskController deployed to:", riskControllerAddress);

  // 5. Deploy BNPL Lending Pool
  console.log("\n5️⃣ Deploying BNPLLendingPool...");
  const BNPLLendingPool = await hre.ethers.getContractFactory(
    "BNPLLendingPool"
  );
  const bnplPool = await BNPLLendingPool.deploy(mockUSDTAddress);
  await bnplPool.waitForDeployment();
  const bnplPoolAddress = await bnplPool.getAddress();
  deployedAddresses.BNPL_LENDING_POOL = bnplPoolAddress;
  console.log("✅ BNPLLendingPool deployed to:", bnplPoolAddress);

  // 6. Deploy Risk Oracle (AI risk score ingestion)
  console.log("\n6️⃣ Deploying RiskOracle...");
  const RiskOracle = await hre.ethers.getContractFactory("RiskOracle");
  const riskOracleV2 = await RiskOracle.deploy();
  await riskOracleV2.waitForDeployment();
  const riskOracleV2Address = await riskOracleV2.getAddress();
  deployedAddresses.RISK_ORACLE = riskOracleV2Address;
  console.log("✅ RiskOracle deployed to:", riskOracleV2Address);

  // 7. Deploy Insurance NFT
  console.log("\n7️⃣ Deploying InsuranceNFT...");
  const InsuranceNFT = await hre.ethers.getContractFactory("InsuranceNFT");
  const insuranceNFT = await InsuranceNFT.deploy();
  await insuranceNFT.waitForDeployment();
  const insuranceNFTAddress = await insuranceNFT.getAddress();
  deployedAddresses.INSURANCE_NFT = insuranceNFTAddress;
  console.log("✅ InsuranceNFT deployed to:", insuranceNFTAddress);

  // 8. Deploy Insurance Pool
  console.log("\n8️⃣ Deploying InsurancePool...");
  const InsurancePool = await hre.ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(mockUSDTAddress);
  await insurancePool.waitForDeployment();
  const insurancePoolAddress = await insurancePool.getAddress();
  deployedAddresses.INSURANCE_POOL = insurancePoolAddress;
  console.log("✅ InsurancePool deployed to:", insurancePoolAddress);

  // 9. Deploy Insurance Manager
  console.log("\n9️⃣ Deploying InsuranceManager...");
  const InsuranceManager = await hre.ethers.getContractFactory("InsuranceManager");
  const insuranceManager = await InsuranceManager.deploy(
    insuranceNFTAddress,
    insurancePoolAddress,
    riskOracleV2Address
  );
  await insuranceManager.waitForDeployment();
  const insuranceManagerAddress = await insuranceManager.getAddress();
  deployedAddresses.INSURANCE_MANAGER = insuranceManagerAddress;
  console.log("✅ InsuranceManager deployed to:", insuranceManagerAddress);

  // 10. Deploy Dynamic Collateral Validator
  console.log("\n🔟 Deploying DynamicCollateralValidator...");
  const DynamicCollateralValidator = await hre.ethers.getContractFactory("DynamicCollateralValidator");
  const dynamicValidator = await DynamicCollateralValidator.deploy(riskOracleV2Address, vaultAddress);
  await dynamicValidator.waitForDeployment();
  const dynamicValidatorAddress = await dynamicValidator.getAddress();
  deployedAddresses.DYNAMIC_VALIDATOR = dynamicValidatorAddress;
  console.log("✅ DynamicCollateralValidator deployed to:", dynamicValidatorAddress);

  // ============================================
  // Configuration After Deployment
  // ============================================

  console.log("\n⚙️  Configuring contracts...\n");

  // Define test asset addresses
  const ETH_ADDRESS = "0x0000000000000000000000000000000000000001";
  const BNB_ADDRESS = "0x0000000000000000000000000000000000000002";
  const MEME_ADDRESS = "0x0000000000000000000000000000000000000003";

  // Configure Dynamic Validator with test assets
  console.log("📊 Setting up risk levels for test assets...");
  
  // ETH - Low Risk (GREEN)
  await dynamicValidator.setAssetRiskLevel(ETH_ADDRESS, 800, 500, 14000, "GREEN");
  console.log("✅ ETH configured: 8% risk, 5% volatility, 140% collateral (GREEN)");
  
  // BNB - Medium Risk (YELLOW)
  await dynamicValidator.setAssetRiskLevel(BNB_ADDRESS, 1200, 800, 16000, "YELLOW");
  console.log("✅ BNB configured: 12% risk, 8% volatility, 160% collateral (YELLOW)");
  
  // Meme Coin - High Risk (RED)
  await dynamicValidator.setAssetRiskLevel(MEME_ADDRESS, 3500, 2800, 22000, "RED");
  console.log("✅ MEME configured: 35% risk, 28% volatility, 220% collateral (RED)");

  // Add test collaterals to vault
  console.log("\n🔒 Adding supported collateral to vault...");
  await vault.addCollateral(ETH_ADDRESS);
  await vault.addCollateral(BNB_ADDRESS);
  await vault.addCollateral(MEME_ADDRESS);
  await vault.addCollateral(mockUSDTAddress);
  console.log("✅ Added ETH, BNB, MEME, and MockUSDT as supported collateral");

  // Set collateral parameters in Risk Controller
  console.log("\n⚙️  Setting risk parameters...");
  await riskController.setCollateralParams(
    ETH_ADDRESS,
    7000, // 70% collateral factor
    11000, // 110% liquidation factor (10% bonus)
    hre.ethers.parseEther("1000") // Max borrow limit
  );
  console.log("✅ Risk parameters configured");

  // Set base interest rate
  console.log("\n💰 Setting interest rates...");
  await bnplPool.setBaseInterestRate(500); // 5% annual
  await bnplPool.setUtilizationMultiplier(2000); // 20%
  console.log("✅ Interest rates configured");

  // Configure insurance contracts
  console.log("\n🛡️  Configuring insurance system...");
  await insuranceNFT.setManager(insuranceManagerAddress);
  await insurancePool.setManager(insuranceManagerAddress);
  await insuranceManager.setLiquidationEngine(liquidationEngineAddress);
  console.log("✅ Insurance system configured");

  // Seed demo risk scores for test accounts
  console.log("\n🧪 Seeding risk scores for demo...");
  const accounts = await hre.ethers.getSigners();
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    const riskPercentage = 1000 + (i * 200);
    await riskOracleV2.setRiskScore(accounts[i].address, 1, riskPercentage);
  }
  console.log("✅ Risk scores seeded for test accounts");
  
  // Fund insurance pool with liquidity
  console.log("\n💵 Funding insurance pool...");
  await mockUSDT.approve(insurancePoolAddress, hre.ethers.parseEther("500000"));
  await insurancePool.depositLiquidity(hre.ethers.parseEther("500000"));
  console.log("✅ Insurance pool funded with 500,000 MockUSDT");

  // ============================================
  // Save Deployment Info
  // ============================================

  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedAddresses,
    testAssets: {
      ETH: ETH_ADDRESS,
      BNB: BNB_ADDRESS,
      MEME: MEME_ADDRESS
    }
  };

  const deploymentPath = path.join(__dirname, '../deployment-info-testnet.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Generate frontend .env file
  const frontendEnv = `# BNB Testnet Configuration
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
NEXT_PUBLIC_VAULT_ADDRESS=${vaultAddress}
NEXT_PUBLIC_LIQUIDATION_ADDRESS=${liquidationEngineAddress}
NEXT_PUBLIC_LENDING_POOL_ADDRESS=${bnplPoolAddress}
NEXT_PUBLIC_ORACLE_ADDRESS=${priceOracleAddress}
NEXT_PUBLIC_RISK_CONTROLLER_ADDRESS=${riskControllerAddress}
NEXT_PUBLIC_MOCK_USDT_ADDRESS=${mockUSDTAddress}
NEXT_PUBLIC_RISK_ORACLE_ADDRESS=${riskOracleV2Address}
NEXT_PUBLIC_INSURANCE_NFT_ADDRESS=${insuranceNFTAddress}
NEXT_PUBLIC_INSURANCE_POOL_ADDRESS=${insurancePoolAddress}
NEXT_PUBLIC_INSURANCE_MANAGER_ADDRESS=${insuranceManagerAddress}
NEXT_PUBLIC_DYNAMIC_VALIDATOR_ADDRESS=${dynamicValidatorAddress}
`;

  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log("📄 Frontend .env.local updated");

  // ============================================
  // Deployment Summary
  // ============================================

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║  Smart Collateral System Deployed to Testnet! ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log("🌐 Network: BNB Smart Chain Testnet (Chain ID: 97)");
  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Remaining Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "tBNB\n");

  console.log("📋 CONTRACT ADDRESSES:\n");
  console.log(`MockUSDT:              ${mockUSDTAddress}`);
  console.log(`PriceOracle:           ${priceOracleAddress}`);
  console.log(`SmartCollateralVault:  ${vaultAddress}`);
  console.log(`LiquidationEngine:     ${liquidationEngineAddress}`);
  console.log(`RiskController:        ${riskControllerAddress}`);
  console.log(`BNPLLendingPool:       ${bnplPoolAddress}`);
  console.log(`RiskOracle:            ${riskOracleV2Address}`);
  console.log(`InsuranceNFT:          ${insuranceNFTAddress}`);
  console.log(`InsurancePool:         ${insurancePoolAddress}`);
  console.log(`InsuranceManager:      ${insuranceManagerAddress}`);
  console.log(`DynamicValidator:      ${dynamicValidatorAddress}`);

  console.log("\n📊 SMART RISK PREDICTION ENGINE:");
  console.log("🟢 ETH:  8% risk,  5% volatility, 140% collateral (GREEN)");
  console.log("🟡 BNB: 12% risk,  8% volatility, 160% collateral (YELLOW)");
  console.log("🔴 MEME: 35% risk, 28% volatility, 220% collateral (RED)");

  console.log("\n🔗 BLOCK EXPLORER:");
  console.log(`https://testnet.bscscan.com/address/${vaultAddress}\n`);

  console.log("✅ NEXT STEPS:");
  console.log("1. Run: cd frontend && npm run dev");
  console.log("2. Open: http://localhost:3000");
  console.log("3. Connect MetaMask to BNB Testnet");
  console.log("4. Network RPC: https://data-seed-prebsc-1-s1.binance.org:8545");
  console.log("5. Chain ID: 97");
  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
