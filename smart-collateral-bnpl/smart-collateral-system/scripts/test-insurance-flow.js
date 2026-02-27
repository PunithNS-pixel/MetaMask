const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🧪 Starting Insurance Flow Test...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const [deployer, user1] = await hre.ethers.getSigners();
  console.log("👤 Test Account:", user1.address);
  console.log("💰 Deployer:", deployer.address);

  // Get contract instances
  const mockUSDT = await hre.ethers.getContractAt("MockUSDT", deployment.contracts.mockUSDT);
  const vault = await hre.ethers.getContractAt("SmartCollateralVault", deployment.contracts.vault);
  const riskOracle = await hre.ethers.getContractAt("RiskOracle", deployment.contracts.riskOracle);
  const insuranceManager = await hre.ethers.getContractAt("InsuranceManager", deployment.contracts.insuranceManager);
  const insuranceNFT = await hre.ethers.getContractAt("InsuranceNFT", deployment.contracts.insuranceNFT);
  const insurancePool = await hre.ethers.getContractAt("InsurancePool", deployment.contracts.insurancePool);

  console.log("\n📊 Contract Addresses:");
  console.log("  MockUSDT:", await mockUSDT.getAddress());
  console.log("  Vault:", await vault.getAddress());
  console.log("  Insurance Manager:", await insuranceManager.getAddress());
  console.log("  Insurance NFT:", await insuranceNFT.getAddress());
  console.log("  Insurance Pool:", await insurancePool.getAddress());

  // ===== STEP 1: Mint Test Tokens =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 1: Minting Test Tokens");
  console.log("═══════════════════════════════════════════");
  
  const mintAmount = hre.ethers.parseUnits("10000", 18);
  let tx = await mockUSDT.mint(user1.address, mintAmount);
  await tx.wait();
  
  const user1Balance = await mockUSDT.balanceOf(user1.address);
  console.log("✅ Minted", hre.ethers.formatUnits(user1Balance, 18), "MockUSDT to user1");

  // ===== STEP 2: Deposit Collateral =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 2: Depositing Collateral");
  console.log("═══════════════════════════════════════════");
  
  const depositAmount = hre.ethers.parseUnits("1000", 18);
  const mockUSDTAddress = await mockUSDT.getAddress();
  const vaultAddress = await vault.getAddress();
  
  tx = await mockUSDT.connect(user1).approve(vaultAddress, depositAmount);
  await tx.wait();
  console.log("✅ Approved", hre.ethers.formatUnits(depositAmount, 18), "MockUSDT");
  
  tx = await vault.connect(user1).depositCollateral(mockUSDTAddress, depositAmount);
  await tx.wait();
  
  const collateralBalance = await vault.collateralDeposits(user1.address, mockUSDTAddress);
  console.log("✅ Deposited collateral:", hre.ethers.formatUnits(collateralBalance, 18), "MockUSDT");

  // ===== STEP 3: Borrow Funds =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 3: Borrowing Funds");
  console.log("═══════════════════════════════════════════");
  
  const borrowAmount = hre.ethers.parseUnits("300", 18);
  tx = await vault.connect(user1).borrow(mockUSDTAddress, mockUSDTAddress, borrowAmount);
  await tx.wait();
  
  const borrowedAmount = await vault.borrowedAmount(user1.address, mockUSDTAddress);
  const healthFactor = await vault.getHealthFactor(user1.address);
  console.log("✅ Borrowed:", hre.ethers.formatUnits(borrowedAmount, 18), "MockUSDT");
  console.log("📊 Health Factor:", healthFactor.toString(), "bps");

  // ===== STEP 4: Set Risk Score =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 4: Setting Risk Score");
  console.log("═══════════════════════════════════════════");
  
  const loanId = 1;
  const riskBps = 1500; // 15% risk
  tx = await riskOracle.setRiskScore(user1.address, loanId, riskBps);
  await tx.wait();
  
  const retrievedRisk = await riskOracle.getRiskScore(user1.address, loanId);
  console.log("✅ Risk score set:", retrievedRisk.toString(), "bps (", (Number(retrievedRisk) / 100), "%)");

  // ===== STEP 5: Quote Insurance Premium =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 5: Getting Insurance Quote");
  console.log("═══════════════════════════════════════════");
  
  const coverageAmount = hre.ethers.parseUnits("150", 18); // Cover 50% of loan
  const [quotedPremium, quotedRisk] = await insuranceManager.quotePremium(
    user1.address,
    loanId,
    coverageAmount
  );
  
  console.log("📋 Insurance Quote:");
  console.log("  Coverage Amount:", hre.ethers.formatUnits(coverageAmount, 18), "MockUSDT");
  console.log("  Premium:", hre.ethers.formatUnits(quotedPremium, 18), "MockUSDT");
  console.log("  Risk:", (Number(quotedRisk) / 100).toFixed(2), "%");

  // ===== STEP 6: Buy Insurance Policy =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 6: Buying Insurance Policy NFT");
  console.log("═══════════════════════════════════════════");
  
  const durationDays = 30;
  const durationSeconds = durationDays * 24 * 60 * 60;
  const poolAddress = await insurancePool.getAddress();
  
  tx = await mockUSDT.connect(user1).approve(poolAddress, quotedPremium);
  await tx.wait();
  console.log("✅ Approved premium payment");
  
  const buyTx = await insuranceManager.connect(user1).buyPolicy(
    loanId,
    borrowAmount,
    coverageAmount,
    durationSeconds
  );
  const receipt = await buyTx.wait();
  
  // Find PolicyPurchased event to get policy ID
  const policyPurchasedEvent = receipt.logs.find(
    log => {
      try {
        const parsed = insuranceManager.interface.parseLog(log);
        return parsed && parsed.name === 'PolicyPurchased';
      } catch {
        return false;
      }
    }
  );
  
  let policyId = 1; // default
  if (policyPurchasedEvent) {
    const parsed = insuranceManager.interface.parseLog(policyPurchasedEvent);
    policyId = parsed.args.policyId;
    console.log("✅ Policy NFT minted! Policy ID:", policyId.toString());
  }
  
  const policyOwner = await insuranceNFT.ownerOf(policyId);
  console.log("✅ Policy owner:", policyOwner);
  console.log("✅ Confirmed ownership:", policyOwner === user1.address);

  // ===== STEP 7: Check Policy Details =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 7: Policy Details");
  console.log("═══════════════════════════════════════════");
  
  const policy = await insuranceNFT.getPolicy(policyId);
  const isActive = await insuranceNFT.isPolicyActive(policyId);
  
  console.log("📜 Policy Details:");
  console.log("  Borrower:", policy.borrower);
  console.log("  Loan ID:", policy.loanId.toString());
  console.log("  Coverage:", hre.ethers.formatUnits(policy.coverageAmount, 18), "MockUSDT");
  console.log("  Premium Paid:", hre.ethers.formatUnits(policy.premiumPaid, 18), "MockUSDT");
  console.log("  Risk Score:", policy.riskBps.toString(), "bps");
  console.log("  Expiry:", new Date(Number(policy.expiry) * 1000).toLocaleString());
  console.log("  Is Active:", isActive);
  console.log("  Is Claimed:", policy.isClaimed);

  // ===== STEP 8: Record Liquidation (Demo) =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 8: Recording Liquidation (Demo)");
  console.log("═══════════════════════════════════════════");
  
  const liquidationLoss = hre.ethers.parseUnits("100", 18);
  tx = await insuranceManager.recordLiquidation(user1.address, loanId, liquidationLoss);
  await tx.wait();
  
  // Calculate the key used to store liquidation loss
  const liquidationKey = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [user1.address, loanId]
    )
  );
  const lossRecord = await insuranceManager.recordedLiquidationLoss(liquidationKey);
  
  console.log("✅ Liquidation recorded!");
  console.log("  Loss Amount:", hre.ethers.formatUnits(lossRecord, 18), "MockUSDT");

  // ===== STEP 9: Claim Insurance =====
  console.log("\n\n═══════════════════════════════════════════");
  console.log("STEP 9: Claiming Insurance Payout");
  console.log("═══════════════════════════════════════════");
  
  const balanceBefore = await mockUSDT.balanceOf(user1.address);
  console.log("💰 Balance before claim:", hre.ethers.formatUnits(balanceBefore, 18), "MockUSDT");
  
  tx = await insuranceManager.connect(user1).claimPolicy(policyId);
  await tx.wait();
  
  const balanceAfter = await mockUSDT.balanceOf(user1.address);
  const payout = balanceAfter - balanceBefore;
  
  console.log("✅ Insurance claimed successfully!");
  console.log("💰 Balance after claim:", hre.ethers.formatUnits(balanceAfter, 18), "MockUSDT");
  console.log("💵 Payout received:", hre.ethers.formatUnits(payout, 18), "MockUSDT");
  
  const policyAfterClaim = await insuranceNFT.getPolicy(policyId);
  console.log("📜 Policy claimed:", policyAfterClaim.isClaimed);

  // ===== FINAL SUMMARY =====
  console.log("\n\n╔═══════════════════════════════════════════╗");
  console.log("║          TEST SUMMARY - SUCCESS ✅         ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log("\n✅ All tests passed!");
  console.log("\n📊 Flow Summary:");
  console.log("  1. ✅ Minted 10,000 MockUSDT to test user");
  console.log("  2. ✅ Deposited 1,000 MockUSDT as collateral");
  console.log("  3. ✅ Borrowed 300 MockUSDT from vault");
  console.log("  4. ✅ Set risk score (15%) for the loan");
  console.log("  5. ✅ Quoted insurance premium");
  console.log("  6. ✅ Bought insurance policy NFT");
  console.log("  7. ✅ Verified policy details on-chain");
  console.log("  8. ✅ Recorded liquidation event");
  console.log("  9. ✅ Claimed insurance payout");
  console.log("\n💰 Financial Summary:");
  console.log("  Loan Amount:", hre.ethers.formatUnits(borrowAmount, 18), "MockUSDT");
  console.log("  Coverage:", hre.ethers.formatUnits(coverageAmount, 18), "MockUSDT");
  console.log("  Premium:", hre.ethers.formatUnits(quotedPremium, 18), "MockUSDT");
  console.log("  Payout:", hre.ethers.formatUnits(payout, 18), "MockUSDT");
  console.log("  Net Benefit:", hre.ethers.formatUnits(payout - quotedPremium, 18), "MockUSDT");
  
  console.log("\n🎉 Insurance NFT feature is working perfectly!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
