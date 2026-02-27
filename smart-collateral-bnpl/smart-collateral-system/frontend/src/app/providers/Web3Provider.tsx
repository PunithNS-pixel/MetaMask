'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBNBTestnet: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const BNB_TESTNET_CHAIN_ID = 97;
const BNB_TESTNET_PARAMS = {
  chainId: '0x61', // 97 in hex
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
  blockExplorerUrls: ['https://testnet.bscscan.com'],
};

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const isCorrectNetwork = chainId === BNB_TESTNET_CHAIN_ID;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      checkConnection();

      return () => {
          if (window.ethereum?.removeListener) {
            window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum?.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await web3Provider.listAccounts();
        
        if (accounts.length > 0) {
          const network = await web3Provider.getNetwork();
          const web3Signer = await web3Provider.getSigner();
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0].address);
          setChainId(Number(network.chainId));
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask to use this dApp');
      return;
    }

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send('eth_requestAccounts', []);
      const network = await web3Provider.getNetwork();
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Auto-switch to BNB Testnet if on wrong network
      if (Number(network.chainId) !== BNB_TESTNET_CHAIN_ID) {
        await switchToBNBTestnet();
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
  };

  const switchToBNBTestnet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BNB_TESTNET_PARAMS.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [BNB_TESTNET_PARAMS],
          });
        } catch (addError) {
          console.error('Error adding BNB Testnet:', addError);
          alert('Failed to add BNB Testnet to MetaMask');
        }
      } else {
        console.error('Error switching to BNB Testnet:', switchError);
        alert('Failed to switch to BNB Testnet');
      }
    }
  };

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToBNBTestnet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
