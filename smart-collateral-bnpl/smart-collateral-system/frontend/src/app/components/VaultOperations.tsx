'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../providers/Web3Provider';
import { getContract, getERC20Contract, formatTokenAmount, parseTokenAmount } from '../../lib/contracts';
import { ethers } from 'ethers';

export default function VaultOperations() {
  const { signer, account, isConnected, isCorrectNetwork } = useWeb3();
  
  const [collateralToken, setCollateralToken] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [userStats, setUserStats] = useState({
    collateralBalance: '0',
    borrowBalance: '0',
    healthFactor: '0',
    canBorrow: '0',
  });

  // Fetch user stats
  const fetchUserStats = async () => {
    if (!signer || !account || !isCorrectNetwork) return;

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      
      const [collateral, borrowed, health, available] = await Promise.all([
        vault.userCollateral(account, collateralToken),
        vault.userBorrowedAmount(account),
        vault.getHealthFactor(account),
        vault.getAvailableToBorrow(account),
      ]);

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
    if (isConnected && isCorrectNetwork && collateralToken) {
      fetchUserStats();
    }
  }, [isConnected, isCorrectNetwork, account, collateralToken]);

  // Deposit Collateral
  const handleDeposit = async () => {
    if (!signer || !collateralToken || !depositAmount) return;

    setLoading(true);
    setTxHash('');

    try {
      // Approve token first
      const tokenContract = getERC20Contract(collateralToken, signer);
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const vaultAddress = await vault.getAddress();
      
      const amount = parseTokenAmount(depositAmount);
      const approveTx = await tokenContract.approve(vaultAddress, amount);
      await approveTx.wait();

      // Deposit collateral
      const depositTx = await vault.depositCollateral(collateralToken, amount);
      const receipt = await depositTx.wait();
      
      setTxHash(receipt.hash);
      setDepositAmount('');
      fetchUserStats();
      alert('Collateral deposited successfully!');
    } catch (error: any) {
      console.error('Deposit error:', error);
      alert(`Deposit failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Borrow
  const handleBorrow = async () => {
    if (!signer || !borrowAmount) return;

    setLoading(true);
    setTxHash('');

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(borrowAmount);
      
      const borrowTx = await vault.borrow(amount);
      const receipt = await borrowTx.wait();
      
      setTxHash(receipt.hash);
      setBorrowAmount('');
      fetchUserStats();
      alert('Borrowed successfully!');
    } catch (error: any) {
      console.error('Borrow error:', error);
      alert(`Borrow failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Repay
  const handleRepay = async () => {
    if (!signer || !repayAmount) return;

    setLoading(true);
    setTxHash('');

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(repayAmount);
      
      // Approve stable token first (assuming USDT)
      const stableToken = await vault.stableToken();
      const tokenContract = getERC20Contract(stableToken, signer);
      const vaultAddress = await vault.getAddress();
      
      const approveTx = await tokenContract.approve(vaultAddress, amount);
      await approveTx.wait();

      // Repay
      const repayTx = await vault.repay(amount);
      const receipt = await repayTx.wait();
      
      setTxHash(receipt.hash);
      setRepayAmount('');
      fetchUserStats();
      alert('Repaid successfully!');
    } catch (error: any) {
      console.error('Repay error:', error);
      alert(`Repay failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw Collateral
  const handleWithdraw = async () => {
    if (!signer || !collateralToken || !withdrawAmount) return;

    setLoading(true);
    setTxHash('');

    try {
      const vault = getContract('SMART_COLLATERAL_VAULT', signer);
      const amount = parseTokenAmount(withdrawAmount);
      
      const withdrawTx = await vault.withdrawCollateral(collateralToken, amount);
      const receipt = await withdrawTx.wait();
      
      setTxHash(receipt.hash);
      setWithdrawAmount('');
      fetchUserStats();
      alert('Collateral withdrawn successfully!');
    } catch (error: any) {
      console.error('Withdraw error:', error);
      alert(`Withdraw failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">Please connect your wallet to start using the platform</p>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-8 text-center">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-semibold text-red-900 mb-2">Wrong Network</h3>
        <p className="text-red-700">Please switch to BNB Testnet to use the platform</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 text-sm mb-1">Collateral Balance</p>
          <p className="text-2xl font-bold">{parseFloat(userStats.collateralBalance).toFixed(4)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-purple-100 text-sm mb-1">Borrowed Amount</p>
          <p className="text-2xl font-bold">{parseFloat(userStats.borrowBalance).toFixed(4)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-green-100 text-sm mb-1">Health Factor</p>
          <p className="text-2xl font-bold">{(parseFloat(userStats.healthFactor) / 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-orange-100 text-sm mb-1">Available to Borrow</p>
          <p className="text-2xl font-bold">{parseFloat(userStats.canBorrow).toFixed(4)}</p>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Collateral */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Deposit Collateral
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Collateral Token Address"
              value={collateralToken}
              onChange={(e) => setCollateralToken(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleDeposit}
              disabled={loading || !collateralToken || !depositAmount}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </div>

        {/* Borrow */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Borrow
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount to Borrow"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleBorrow}
              disabled={loading || !borrowAmount}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Borrow'}
            </button>
          </div>
        </div>

        {/* Repay */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Repay Loan
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount to Repay"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleRepay}
              disabled={loading || !repayAmount}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Repay'}
            </button>
          </div>
        </div>

        {/* Withdraw Collateral */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Withdraw Collateral
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount to Withdraw"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={handleWithdraw}
              disabled={loading || !withdrawAmount}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Hash */}
      {txHash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            Transaction successful:{' '}
            <a
              href={`https://testnet.bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline hover:text-green-900"
            >
              {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
