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

  // ============================================
  // Configuration After Deployment
  // ============================================

  console.log("\n⚙️  Configuring contracts...\n");

  // Add a test collateral (would normally be USDT, USDC, BNB, etc.)
  // Using mock BNB address for testing
  const mockBNB = "0x000000000000000000000000000000000000000b";

  console.log("Adding supported collateral...");
  await vault.addCollateral(mockBNB);
  console.log("✅ Added BNB as supported collateral");

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

  console.log("\n📊 CONFIGURATION:");
  console.log("- Min Collateral Ratio: 150%");
  console.log("- Liquidation Threshold: 120%");
  console.log("- Liquidation Bonus: 10%");
  console.log("- Base Interest Rate: 5% APY");
  console.log("- Utilization Multiplier: 20%");

  console.log("\n✅ NEXT STEPS:");
  console.log("1. Save the contract addresses above");
  console.log("2. Deploy a test token or use existing USDT/USDC");
  console.log("3. Set up Chainlink price feeds for collatals");
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
