'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useWeb3 } from '../providers/Web3Provider';
import DynamicRiskDisplay from './DynamicRiskDisplay';
import {
  CONTRACT_ADDRESSES,
  getContract,
  getERC20Contract,
  formatTokenAmount,
  parseTokenAmount,
} from '../../lib/contracts';

export default function VaultOperations() {
  const { signer, account, isConnected, isCorrectNetwork } = useWeb3();

  const mockUsdtAddress = CONTRACT_ADDRESSES.MOCK_USDT;
  const defaultCollateral = useMemo(() => mockUsdtAddress || '', [mockUsdtAddress]);

  const [collateralToken, setCollateralToken] = useState(defaultCollateral);
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [loanId, setLoanId] = useState('1');
  const [loanAmountForPolicy, setLoanAmountForPolicy] = useState('100');
  const [coverageAmount, setCoverageAmount] = useState('50');
  const [durationDays, setDurationDays] = useState('7');
  const [policyIdToClaim, setPolicyIdToClaim] = useState('1');
  const [liquidationLossAmount, setLiquidationLossAmount] = useState('20');

  const [quotedPremium, setQuotedPremium] = useState('0');
  const [quotedRisk, setQuotedRisk] = useState('0');

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [userStats, setUserStats] = useState({
    collateralBalance: '0',
    borrowBalance: '0',
    healthFactor: '0',
    canBorrow: '0',
  });

  useEffect(() => {
    if (!collateralToken && defaultCollateral) {
      setCollateralToken(defaultCollateral);
    }
  }, [collateralToken, defaultCollateral]);

  const fetchUserStats = async () => {
    if (!signer || !account || !isCorrectNetwork || !collateralToken || !mockUsdtAddress) return;

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);

      const [collateral, borrowed, health, collateralValue, totalDebt, minRatio] = await Promise.all([
        vault.collateralDeposits(account, collateralToken),
        vault.borrowedAmount(account, mockUsdtAddress),
        vault.getHealthFactor(account),
        vault.getCollateralValue(account),
        vault.getTotalDebt(account),
        vault.minCollateralRatio(),
      ]);

      let available = BigInt(0);
      if (collateralValue > BigInt(0)) {
        const maxDebt = (collateralValue * BigInt(10000)) / minRatio;
        available = maxDebt > totalDebt ? maxDebt - totalDebt : BigInt(0);
      }

      setUserStats({
        collateralBalance: formatTokenAmount(collateral),
        borrowBalance: formatTokenAmount(borrowed),
        healthFactor: health.toString(),
        canBorrow: formatTokenAmount(available),
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [isConnected, isCorrectNetwork, account, signer, collateralToken, mockUsdtAddress]);

  const resetFeedback = () => {
    setTxHash('');
    setErrorMsg('');
  };

  const handleDeposit = async () => {
    if (!signer || !collateralToken || !depositAmount) return;
    setLoading(true);
    resetFeedback();

    try {
      const token = getERC20Contract(collateralToken, signer);
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(depositAmount);
      const vaultAddress = await vault.getAddress();

      await (await token.approve(vaultAddress, amount)).wait();
      const receipt = await (await vault.depositCollateral(collateralToken, amount)).wait();

      setTxHash(receipt.hash);
      setDepositAmount('');
      await fetchUserStats();
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!signer || !collateralToken || !borrowAmount || !mockUsdtAddress) return;
    setLoading(true);
    resetFeedback();

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(borrowAmount);
      const receipt = await (await vault.borrow(collateralToken, mockUsdtAddress, amount)).wait();

      setTxHash(receipt.hash);
      setBorrowAmount('');
      await fetchUserStats();
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Borrow failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!signer || !repayAmount || !mockUsdtAddress) return;
    setLoading(true);
    resetFeedback();

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(repayAmount);
      const token = getERC20Contract(mockUsdtAddress, signer);
      const vaultAddress = await vault.getAddress();

      await (await token.approve(vaultAddress, amount)).wait();
      const receipt = await (await vault.repay(mockUsdtAddress, amount)).wait();

      setTxHash(receipt.hash);
      setRepayAmount('');
      await fetchUserStats();
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Repay failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !collateralToken || !withdrawAmount) return;
    setLoading(true);
    resetFeedback();

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(withdrawAmount);
      const receipt = await (await vault.withdrawCollateral(collateralToken, amount)).wait();

      setTxHash(receipt.hash);
      setWithdrawAmount('');
      await fetchUserStats();
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Withdraw failed');
    } finally {
      setLoading(false);
    }
  };

  const quoteInsurance = async () => {
    if (!signer || !account || !coverageAmount || !loanId) return;
    setLoading(true);
    resetFeedback();

    try {
      const manager = getContract('INSURANCE_MANAGER', signer);
      const coverage = parseTokenAmount(coverageAmount);
      const [premium, riskBps] = await manager.quotePremium(account, BigInt(loanId), coverage);

      setQuotedPremium(formatTokenAmount(premium));
      setQuotedRisk((Number(riskBps) / 100).toFixed(2));
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Quote failed (check risk score)');
    } finally {
      setLoading(false);
    }
  };

  const buyInsurance = async () => {
    if (!signer || !loanId || !coverageAmount || !loanAmountForPolicy || !durationDays) return;
    setLoading(true);
    resetFeedback();

    try {
      const manager = getContract('INSURANCE_MANAGER', signer);
      const poolAddress = CONTRACT_ADDRESSES.INSURANCE_POOL;
      if (!poolAddress || !mockUsdtAddress) throw new Error('Insurance pool or token not configured');

      const coverage = parseTokenAmount(coverageAmount);
      const loanAmount = parseTokenAmount(loanAmountForPolicy);
      const duration = BigInt(Number(durationDays) * 24 * 60 * 60);

      const [premium] = await manager.quotePremium(await signer.getAddress(), BigInt(loanId), coverage);
      const token = getERC20Contract(mockUsdtAddress, signer);
      await (await token.approve(poolAddress, premium)).wait();

      const receipt = await (
        await manager.buyPolicy(BigInt(loanId), loanAmount, coverage, duration)
      ).wait();

      setTxHash(receipt.hash);
      await fetchUserStats();
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Policy purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const recordDemoLiquidation = async () => {
    if (!signer || !loanId || !liquidationLossAmount || !account) return;
    setLoading(true);
    resetFeedback();

    try {
      const manager = getContract('INSURANCE_MANAGER', signer);
      const loss = parseTokenAmount(liquidationLossAmount);
      const receipt = await (await manager.recordLiquidation(account, BigInt(loanId), loss)).wait();
      setTxHash(receipt.hash);
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Record liquidation failed (owner-only on demo)');
    } finally {
      setLoading(false);
    }
  };

  const claimInsurance = async () => {
    if (!signer || !policyIdToClaim) return;
    setLoading(true);
    resetFeedback();

    try {
      const manager = getContract('INSURANCE_MANAGER', signer);
      const receipt = await (await manager.claimPolicy(BigInt(policyIdToClaim))).wait();
      setTxHash(receipt.hash);
    } catch (error: any) {
      setErrorMsg(error?.shortMessage || error?.message || 'Claim failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-900 font-semibold">Connect wallet to use lending and insurance</p>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-red-900 mb-2">Wrong Network</h3>
        <p className="text-red-900 font-bold">Switch to the configured network in the header wallet controls</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 text-sm mb-1">Collateral Balance</p>
          <p className="text-2xl font-bold">{parseFloat(userStats.collateralBalance || '0').toFixed(4)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-purple-100 text-sm mb-1">Borrowed Amount</p>
          <p className="text-2xl font-bold">{parseFloat(userStats.borrowBalance || '0').toFixed(4)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-green-100 text-sm mb-1">Health Factor</p>
          <p className="text-2xl font-bold">{(Number(userStats.healthFactor) / 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-orange-100 text-sm mb-1">Available to Borrow</p>
          <p className="text-2xl font-bold">{parseFloat(userStats.canBorrow || '0').toFixed(4)}</p>
        </div>
      </div>

      <DynamicRiskDisplay />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-3">
          <h3 className="text-xl font-bold text-gray-900">Deposit Collateral</h3>
          <input type="text" placeholder="Collateral Token Address" value={collateralToken} onChange={(e) => setCollateralToken(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
          <input type="number" placeholder="Amount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
          <button onClick={handleDeposit} disabled={loading || !depositAmount || !collateralToken} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">{loading ? 'Processing...' : 'Deposit'}</button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-3">
          <h3 className="text-xl font-bold text-gray-900">Borrow / Repay / Withdraw</h3>
          <input type="number" placeholder="Borrow amount" value={borrowAmount} onChange={(e) => setBorrowAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
          <button onClick={handleBorrow} disabled={loading || !borrowAmount || !collateralToken} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">Borrow</button>

          <input type="number" placeholder="Repay amount" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
          <button onClick={handleRepay} disabled={loading || !repayAmount} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">Repay</button>

          <input type="number" placeholder="Withdraw amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
          <button onClick={handleWithdraw} disabled={loading || !withdrawAmount || !collateralToken} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">Withdraw</button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200 space-y-4">
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <h3 className="text-2xl font-bold text-indigo-900 mb-1">Shield Icon Liquidation Insurance NFT</h3>
          <p className="text-sm text-indigo-700 font-semibold">Protect your loan from liquidation with an insurance policy</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Loan ID</label>
            <input type="number" placeholder="e.g., 1" value={loanId} onChange={(e) => setLoanId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
            <p className="text-xs text-gray-600 mt-1">Unique identifier for your loan</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Loan Amount (mUSDT)</label>
            <input type="number" placeholder="e.g., 300" value={loanAmountForPolicy} onChange={(e) => setLoanAmountForPolicy(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
            <p className="text-xs text-gray-600 mt-1">Total amount you borrowed</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Coverage Amount (mUSDT)</label>
            <input type="number" placeholder="e.g., 150" value={coverageAmount} onChange={(e) => setCoverageAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
            <p className="text-xs text-gray-600 mt-1">Protection amount (max 60% of loan)</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Duration (days)</label>
            <input type="number" placeholder="e.g., 30" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
            <p className="text-xs text-gray-600 mt-1">How long the policy is active</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={quoteInsurance} disabled={loading || !coverageAmount || !loanId} className="bg-gradient-to-r from-slate-700 to-slate-800 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50 hover:shadow-lg transition">Get Quote</button>
          <button onClick={buyInsurance} disabled={loading || !coverageAmount || !loanAmountForPolicy || !durationDays} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-lg disabled:opacity-50 hover:shadow-lg transition">Buy Policy NFT</button>
        </div>

        {quotedPremium !== '0' && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-3">
            <p className="text-lg text-gray-900 font-bold">Premium Quote: <span className="text-blue-700 text-xl">{quotedPremium}</span> mUSDT</p>
            <p className="text-base text-gray-900 font-bold mt-1">Risk Level: <span className="text-red-700">{quotedRisk}%</span> liquidation probability</p>
          </div>
        )}

        <div className="border-t border-indigo-200 pt-4 mt-4">
          <h4 className="text-lg font-bold text-gray-900 mb-3">Claim Your Insurance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Policy ID</label>
              <input type="number" placeholder="e.g., 1" value={policyIdToClaim} onChange={(e) => setPolicyIdToClaim(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Liquidation Loss (mUSDT)</label>
              <input type="number" placeholder="e.g., 100" value={liquidationLossAmount} onChange={(e) => setLiquidationLossAmount(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-900" />
            </div>
            <div className="flex gap-2 pt-6">
              <button onClick={recordDemoLiquidation} disabled={loading || !liquidationLossAmount || !loanId} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-3 py-2 rounded-lg disabled:opacity-50 hover:shadow-lg transition">Record Liquidation</button>
              <button onClick={claimInsurance} disabled={loading || !policyIdToClaim} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold px-3 py-2 rounded-lg disabled:opacity-50 hover:shadow-lg transition">Claim Payout</button>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-base font-bold text-red-900">{errorMsg}</div>
      )}

      {txHash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-base font-bold text-green-900 break-all">
          Tx: {txHash}
        </div>
      )}
    </div>
  );
}
