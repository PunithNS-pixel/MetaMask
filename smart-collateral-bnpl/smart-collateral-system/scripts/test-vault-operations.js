const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 Testing Vault Operations...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Load deployment info
  const fs = require('fs');
  const deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));

  // Get contract instances
  const MockUSDT = await ethers.getContractAt("MockUSDT", deploymentInfo.contracts.mockUSDT);
  const Vault = await ethers.getContractAt("SmartCollateralVault", deploymentInfo.contracts.vault);
  const RiskOracle = await ethers.getContractAt("RiskOracle", deploymentInfo.contracts.riskOracle);
  const DynamicValidator = await ethers.getContractAt("DynamicCollateralValidator", deploymentInfo.contracts.dynamicValidator);

  console.log("\n📊 Testing Dynamic Risk Display...");
  
  // Test the three assets
  const assets = [
    { name: "ETH", address: "0x0000000000000000000000000000000000000001" },
    { name: "BNB", address: "0x0000000000000000000000000000000000000002" },
    { name: "Meme Coin", address: "0x0000000000000000000000000000000000000003" }
  ];

  for (const asset of assets) {
    try {
      const riskInfo = await DynamicValidator.getAssetRiskInfo(asset.address);
      console.log(`\n✅ ${asset.name}:`);
      console.log(`   Risk Score: ${riskInfo.riskScorePercent}%`);
      console.log(`   Volatility: ${riskInfo.volatilityPercent}%`);
      console.log(`   Required Collateral: ${riskInfo.requiredCollateralPercent}%`);
      console.log(`   Risk Level: ${riskInfo.riskLevel}`);
    } catch (error) {
      console.error(`❌ Error fetching risk for ${asset.name}:`, error.message);
    }
  }

  console.log("\n\n📊 Testing Vault Operations...");

  // Get initial balance
  const initialBalance = await MockUSDT.balanceOf(deployer.address);
  console.log(`Initial USDT Balance: ${ethers.formatUnits(initialBalance, 18)}`);

  // Test 1: Deposit Collateral
  console.log("\n1️⃣ Testing Deposit Collateral...");
  const depositAmount = ethers.parseUnits("1000", 18);
  
  try {
    await MockUSDT.approve(await Vault.getAddress(), depositAmount);
    await Vault.depositCollateral(await MockUSDT.getAddress(), depositAmount);
    
    const collateralBalance = await Vault.collateralDeposits(deployer.address, await MockUSDT.getAddress());
    console.log(`✅ Deposited: ${ethers.formatUnits(collateralBalance, 18)} USDT`);
  } catch (error) {
    console.error("❌ Deposit failed:", error.message);
  }

  // Test 2: Check Health Factor
  console.log("\n2️⃣ Testing Health Factor...");
  try {
    const healthFactor = await Vault.getHealthFactor(deployer.address);
    console.log(`✅ Health Factor: ${Number(healthFactor) / 100}%`);
  } catch (error) {
    console.error("❌ Health Factor check failed:", error.message);
  }

  // Test 3: Borrow
  console.log("\n3️⃣ Testing Borrow...");
  const borrowAmount = ethers.parseUnits("500", 18);
  
  try {
    await Vault.borrow(await MockUSDT.getAddress(), await MockUSDT.getAddress(), borrowAmount);
    
    const borrowedBalance = await Vault.borrowedAmount(deployer.address, await MockUSDT.getAddress());
    console.log(`✅ Borrowed: ${ethers.formatUnits(borrowedBalance, 18)} USDT`);
    
    // Check health factor after borrow
    const newHealthFactor = await Vault.getHealthFactor(deployer.address);
    console.log(`   New Health Factor: ${Number(newHealthFactor) / 100}%`);
  } catch (error) {
    console.error("❌ Borrow failed:", error.message);
  }

  // Test 4: Repay
  console.log("\n4️⃣ Testing Repay...");
  const repayAmount = ethers.parseUnits("250", 18);
  
  try {
    await MockUSDT.approve(await Vault.getAddress(), repayAmount);
    await Vault.repay(await MockUSDT.getAddress(), repayAmount);
    
    const remainingDebt = await Vault.borrowedAmount(deployer.address, await MockUSDT.getAddress());
    console.log(`✅ Repaid 250 USDT`);
    console.log(`   Remaining Debt: ${ethers.formatUnits(remainingDebt, 18)} USDT`);
  } catch (error) {
    console.error("❌ Repay failed:", error.message);
  }

  // Test 5: Withdraw
  console.log("\n5️⃣ Testing Withdraw...");
  const withdrawAmount = ethers.parseUnits("200", 18);
  
  try {
    await Vault.withdrawCollateral(await MockUSDT.getAddress(), withdrawAmount);
    
    const finalCollateral = await Vault.collateralDeposits(deployer.address, await MockUSDT.getAddress());
    console.log(`✅ Withdrew 200 USDT`);
    console.log(`   Remaining Collateral: ${ethers.formatUnits(finalCollateral, 18)} USDT`);
  } catch (error) {
    console.error("❌ Withdraw failed:", error.message);
  }

  console.log("\n\n✅ All tests completed!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
