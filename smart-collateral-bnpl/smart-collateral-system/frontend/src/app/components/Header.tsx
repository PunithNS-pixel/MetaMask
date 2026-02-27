'use client';

import React from 'react';
import { useWeb3 } from '../providers/Web3Provider';
import { shortenAddress } from '../../lib/contracts';

export default function Header() {
  const { account, isConnected, isCorrectNetwork, connectWallet, disconnectWallet, switchToBNBTestnet } = useWeb3();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Collateral BNPL</h1>
              <p className="text-xs text-gray-500">Decentralized Lending Platform</p>
            </div>
          </div>

          {/* Network Status and Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Indicator */}
            {isConnected && (
              <div className="flex items-center space-x-2">
                {isCorrectNetwork ? (
                  <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">BNB Testnet</span>
                  </div>
                ) : (
                  <button
                    onClick={switchToBNBTestnet}
                    className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-100 transition-colors"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">Wrong Network</span>
                    <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg px-4 py-2 font-medium shadow-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm">{shortenAddress(account!)}</span>
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Disconnect"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
