const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Smart Collateral System...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BNB");

  // 0. Deploy Mock USDT for testing
  console.log("\n0️⃣ Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed to:", mockUSDTAddress);

  // 1. Deploy Price Oracle
  console.log("\n1️⃣ Deploying PriceOracle...");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("✅ PriceOracle deployed to:", priceOracleAddress);

  // 2. Deploy SmartCollateralVault
  console.log("\n2️⃣ Deploying SmartCollateralVault...");
  const SmartCollateralVault = await hre.ethers.getContractFactory(
    "SmartCollateralVault"
  );
  const vault = await SmartCollateralVault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ SmartCollateralVault deployed to:", vaultAddress);

  // 3. Deploy LiquidationEngine
  console.log("\n3️⃣ Deploying LiquidationEngine...");
  const LiquidationEngine = await hre.ethers.getContractFactory(
    "LiquidationEngine"
  );
  const liquidationEngine = await LiquidationEngine.deploy(vaultAddress);
  await liquidationEngine.waitForDeployment();
  const liquidationEngineAddress = await liquidationEngine.getAddress();
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
  console.log("✅ RiskController deployed to:", riskControllerAddress);

  // 5. Deploy BNPL Lending Pool
  console.log("\n5️⃣ Deploying BNPLLendingPool...");
  const BNPLLendingPool = await hre.ethers.getContractFactory(
    "BNPLLendingPool"
  );

  const bnplPool = await BNPLLendingPool.deploy(mockUSDTAddress);
  await bnplPool.waitForDeployment();
  const bnplPoolAddress = await bnplPool.getAddress();
  console.log("✅ BNPLLendingPool deployed to:", bnplPoolAddress);

  // 6. Deploy Risk Oracle (AI risk score ingestion)
  console.log("\n6️⃣ Deploying RiskOracle...");
  const RiskOracle = await hre.ethers.getContractFactory("RiskOracle");
  const riskOracleV2 = await RiskOracle.deploy();
  await riskOracleV2.waitForDeployment();
  const riskOracleV2Address = await riskOracleV2.getAddress();
  console.log("✅ RiskOracle deployed to:", riskOracleV2Address);

  // 7. Deploy Insurance NFT
  console.log("\n7️⃣ Deploying InsuranceNFT...");
  const InsuranceNFT = await hre.ethers.getContractFactory("InsuranceNFT");
  const insuranceNFT = await InsuranceNFT.deploy();
  await insuranceNFT.waitForDeployment();
  const insuranceNFTAddress = await insuranceNFT.getAddress();
  console.log("✅ InsuranceNFT deployed to:", insuranceNFTAddress);

  // 8. Deploy Insurance Pool
  console.log("\n8️⃣ Deploying InsurancePool...");
  const InsurancePool = await hre.ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(mockUSDTAddress);
  await insurancePool.waitForDeployment();
  const insurancePoolAddress = await insurancePool.getAddress();
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
  console.log("✅ InsuranceManager deployed to:", insuranceManagerAddress);

  // 10. Deploy Dynamic Collateral Validator
  console.log("\n🔟 Deploying DynamicCollateralValidator...");
  const DynamicCollateralValidator = await hre.ethers.getContractFactory("DynamicCollateralValidator");
  const dynamicValidator = await DynamicCollateralValidator.deploy(riskOracleV2Address, vaultAddress);
  await dynamicValidator.waitForDeployment();
  const dynamicValidatorAddress = await dynamicValidator.getAddress();
  console.log("✅ DynamicCollateralValidator deployed to:", dynamicValidatorAddress);

  // ============================================
  // Configuration After Deployment
  // ============================================

  console.log("\n⚙️  Configuring contracts...\n");

  // Add test collaterals
  const mockBNB = "0x000000000000000000000000000000000000000b";

  console.log("Adding supported collateral...");
  await vault.addCollateral(mockBNB);
  await vault.addCollateral(mockUSDTAddress);
  console.log("✅ Added BNB and MockUSDT as supported collateral");

  // Set collateral parameters
  console.log("Setting risk parameters...");
  await riskController.setCollateralParams(
    mockBNB,
    7000, // 70% collateral factor
    11000, // 110% liquidation factor (10% bonus)
    hre.ethers.parseEther("1000") // Max borrow limit
  );
  console.log("✅ Risk parameters configured");

  // Set base interest rate
  console.log("Setting interest rates...");
  await bnplPool.setBaseInterestRate(500); // 5% annual
  await bnplPool.setUtilizationMultiplier(2000); // 20%
  console.log("✅ Interest rates configured");

  // Configure insurance contracts
  console.log("Setting insurance params...");
  await insuranceNFT.setManager(insuranceManagerAddress);
  await insurancePool.setManager(insuranceManagerAddress);
  await insuranceManager.setLiquidationEngine(liquidationEngineAddress);

  // Seed demo risk scores for all test accounts (they'll all use loanId 1-5)
  const accounts = await hre.ethers.getSigners();
  console.log("Seeding risk scores for test accounts...");
  for (let i = 0; i < Math.min(5, accounts.length); i++) {
    // Set different risk scores for variety: 10%, 12%, 15%, 18%, 20%
    const riskPercentage = 1000 + (i * 200);
    await riskOracleV2.setRiskScore(accounts[i].address, 1, riskPercentage);
  }
  console.log("✅ Risk scores seeded for 5 test accounts");
  
  // Fund insurance pool with liquidity
  console.log("💰 Funding insurance pool with liquidity...");
  await mockUSDT.approve(insurancePoolAddress, hre.ethers.parseEther("500000"));
  await insurancePool.depositLiquidity(hre.ethers.parseEther("500000"));
  console.log("✅ Insurance pool funded with 500,000 MockUSDT");

  // ============================================
  // Deployment Summary
  // ============================================

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║    Smart Collateral System Deployed! 🎉       ║");
  console.log("╚════════════════════════════════════════════════╝\n");

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

  console.log("\n📊 CONFIGURATION:");
  console.log("- ETH Collateral Ratio: 140% (Low Risk)");
  console.log("- BNB Collateral Ratio: 160% (Medium Risk)");
  console.log("- Meme Collateral Ratio: 220% (High Risk)");
  console.log("- Base Interest Rate: 5% APY");
  console.log("- Utilization Multiplier: 20%");

  console.log("\n✅ SMART RISK PREDICTION ENGINE:");
  console.log("🧠 Dynamic Liquidation Risk Assessment");
  console.log("📊 Asset-based Risk Scoring (8% - 35%)");
  console.log("🔒 Dynamic Collateral Requirements");
  console.log("📈 Real-time Risk Display in UI");

  console.log("\n✅ NEXT STEPS:");
  console.log("1. Save the contract addresses above");
  console.log("2. Test dynamic collateral validation");
  console.log("3. View risk assessment in frontend");
  console.log("4. Run tests with: npm test");
  console.log("5. Verify contracts on Etherscan/BscScan");

  console.log("\n🔗 Useful Links:");
  console.log(
    "- BNB Chain Testnet: https://testnet.bscscan.com/"
  );
  console.log(
    "- Chainlink Testnet Feeds: https://docs.chain.link/data-feeds/price-feeds/addresses"
  );

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      mockUSDT: mockUSDTAddress,
      priceOracle: priceOracleAddress,
      vault: vaultAddress,
      liquidationEngine: liquidationEngineAddress,
      riskController: riskControllerAddress,
      bnplPool: bnplPoolAddress,
      riskOracle: riskOracleV2Address,
      insuranceNFT: insuranceNFTAddress,
      insurancePool: insurancePoolAddress,
      insuranceManager: insuranceManagerAddress,
      dynamicValidator: dynamicValidatorAddress,
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
