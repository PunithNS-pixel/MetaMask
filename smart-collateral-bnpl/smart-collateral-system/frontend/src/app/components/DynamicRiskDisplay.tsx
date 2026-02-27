'use client';

import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../providers/Web3Provider';
import { CONTRACT_ADDRESSES, getContract } from '../../lib/contracts';

interface AssetRiskInfo {
  riskScorePercent: string;
  volatilityPercent: string;
  requiredCollateralPercent: string;
  riskLevel: string;
}

interface RiskAsset {
  name: string;
  address: string;
  riskInfo: AssetRiskInfo | null;
  loading: boolean;
}

export default function DynamicRiskDisplay() {
  const { signer, isConnected, isCorrectNetwork } = useWeb3();

  const [assets, setAssets] = useState<RiskAsset[]>([
    { name: 'ETH', address: '0x0000000000000000000000000000000000000001', riskInfo: null, loading: true },
    { name: 'BNB', address: '0x0000000000000000000000000000000000000002', riskInfo: null, loading: true },
    { name: 'Meme Coin', address: '0x0000000000000000000000000000000000000003', riskInfo: null, loading: true },
  ]);

  useEffect(() => {
    const fetchRiskData = async () => {
      if (!signer || !isCorrectNetwork) return;

      try {
        const validatorAddress = CONTRACT_ADDRESSES.DYNAMIC_VALIDATOR;
        if (!validatorAddress) {
          console.error('DynamicCollateralValidator address not found');
          return;
        }

        const validator = getContract('DYNAMIC_VALIDATOR', signer);

        const newAssets = await Promise.all(
          assets.map(async (asset) => {
            try {
              const riskInfo = await validator.getAssetRiskInfo(asset.address);
              return {
                ...asset,
                riskInfo: {
                  riskScorePercent: Number(riskInfo.riskScorePercent).toString(),
                  volatilityPercent: Number(riskInfo.volatilityPercent).toString(),
                  requiredCollateralPercent: Number(riskInfo.requiredCollateralPercent).toString(),
                  riskLevel: riskInfo.riskLevel,
                },
                loading: false,
              };
            } catch (error) {
              console.error(`Error fetching risk for ${asset.name}:`, error);
              return { ...asset, loading: false };
            }
          })
        );

        setAssets(newAssets);
      } catch (error) {
        console.error('Error fetching risk data:', error);
      }
    };

    if (isConnected) {
      fetchRiskData();
    }
  }, [signer, isCorrectNetwork, isConnected]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'GREEN':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'YELLOW':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'RED':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'GREEN':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'YELLOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'RED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl shadow-lg p-6 border border-cyan-200 space-y-4">
      <div className="bg-white rounded-lg p-4 border border-cyan-100">
        <h3 className="text-2xl font-bold text-cyan-900 mb-1">⚡ Smart Risk Prediction Engine</h3>
        <p className="text-sm text-cyan-700 font-semibold">Dynamic liquidation risk assessment & collateral requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.address}
            className={`rounded-lg border-2 p-4 transition-all ${
              asset.riskInfo
                ? getRiskColor(asset.riskInfo.riskLevel)
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-lg font-bold">{asset.name}</h4>
              {asset.riskInfo && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeColor(asset.riskInfo.riskLevel)}`}>
                  {asset.riskInfo.riskLevel}
                </span>
              )}
            </div>

            {asset.loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ) : asset.riskInfo ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Liquidation Risk:</span>
                  <span className="font-bold">{asset.riskInfo.riskScorePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Volatility:</span>
                  <span className="font-bold">{asset.riskInfo.volatilityPercent}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-current border-opacity-20">
                  <span className="font-semibold">Required Ratio:</span>
                  <span className="font-bold text-base">{asset.riskInfo.requiredCollateralPercent}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Failed to load risk data</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
        <h4 className="font-bold text-gray-900">📊 How It Works</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex gap-2">
            <span className="font-semibold min-w-fit">🟢 Green (8-10%):</span>
            <span>Stable assets like ETH with low liquidation risk - 140% collateral required</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-fit">🟡 Yellow (12-25%):</span>
            <span>Medium-risk assets like BNB with moderate volatility - 160% collateral required</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold min-w-fit">🔴 Red (35%+):</span>
            <span>High-risk assets like meme coins with extreme volatility - 220% collateral required</span>
          </div>
        </div>
        <div className="border-t pt-3 mt-3 text-xs text-gray-600 italic">
          <p>💡 Higher risk assets require more collateral to protect the lending pool from liquidation events. This dynamic approach improves capital efficiency while maintaining protocol safety.</p>
        </div>
      </div>
    </div>
  );
}
