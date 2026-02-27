const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Smart Collateral System...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // 1. Deploy Price Oracle
  console.log("\n1️⃣ Deploying PriceOracle...");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.deployed();
  console.log("✅ PriceOracle deployed to:", priceOracle.address);

  // 2. Deploy SmartCollateralVault
  console.log("\n2️⃣ Deploying SmartCollateralVault...");
  const SmartCollateralVault = await hre.ethers.getContractFactory(
    "SmartCollateralVault"
  );
  const vault = await SmartCollateralVault.deploy();
  await vault.deployed();
  console.log("✅ SmartCollateralVault deployed to:", vault.address);

  // 3. Deploy LiquidationEngine
  console.log("\n3️⃣ Deploying LiquidationEngine...");
  const LiquidationEngine = await hre.ethers.getContractFactory(
    "LiquidationEngine"
  );
  const liquidationEngine = await LiquidationEngine.deploy(vault.address);
  await liquidationEngine.deployed();
  console.log("✅ LiquidationEngine deployed to:", liquidationEngine.address);

  // 4. Deploy RiskController
  console.log("\n4️⃣ Deploying RiskController...");
  const RiskController = await hre.ethers.getContractFactory("RiskController");
  const riskController = await RiskController.deploy(
    vault.address,
    priceOracle.address
  );
  await riskController.deployed();
  console.log("✅ RiskController deployed to:", riskController.address);

  // 5. Deploy BNPL Lending Pool (requires a mock token)
  console.log("\n5️⃣ Deploying BNPLLendingPool...");
  const BNPLLendingPool = await hre.ethers.getContractFactory(
    "BNPLLendingPool"
  );

  // For testing, we can use a mock token or deploy a real one
  // For now, we'll use a placeholder
  const mockTokenAddress = "0x0000000000000000000000000000000000000000";

  const bnplPool = await BNPLLendingPool.deploy(mockTokenAddress);
  await bnplPool.deployed();
  console.log("✅ BNPLLendingPool deployed to:", bnplPool.address);

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
    hre.ethers.utils.parseEther("1000") // Max borrow limit
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
  console.log(`PriceOracle:           ${priceOracle.address}`);
  console.log(`SmartCollateralVault:  ${vault.address}`);
  console.log(`LiquidationEngine:     ${liquidationEngine.address}`);
  console.log(`RiskController:        ${riskController.address}`);
  console.log(`BNPLLendingPool:       ${bnplPool.address}`);

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
      priceOracle: priceOracle.address,
      vault: vault.address,
      liquidationEngine: liquidationEngine.address,
      riskController: riskController.address,
      bnplPool: bnplPool.address,
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
