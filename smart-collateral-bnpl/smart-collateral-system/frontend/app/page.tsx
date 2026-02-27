import Header from '../src/app/components/Header';
import VaultOperations from '../src/app/components/VaultOperations';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to Smart Collateral BNPL
            </h1>
            <p className="text-lg text-orange-100 mb-6">
              A decentralized Buy Now Pay Later platform powered by smart collateral management.
              Deposit collateral, borrow stablecoins, and manage your loans with complete transparency.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-semibold">Secure & Audited</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-semibold">Fast Transactions</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Low Fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vault Operations */}
        <VaultOperations />
      </main>
    </div>
  );
}
