export function getChainIcon(chainIdString: string): string {
    const chainId = chainIdString?.replace("eip155:", "");
  
    const chainIcons: Record<string, string> = {
      "1": "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",         // Ethereum Mainnet
      "42161": "/chains/arbitrum.svg",     // Arbitrum One
      "8453": "/chains/base.svg",          // Base
      "81457": "/chains/blast.svg",        // Blast
      "7887": "/chains/kinto.svg",         // Kinto
      "98866": "/chains/zora.svg",         // Zora Mainnet
      "11155111": "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",   // Ethereum Sepolia
      "421614": "/chains/arbitrum-sepolia.svg", // Arbitrum Sepolia
      "84532": "/chains/base-sepolia.svg", // Base Sepolia
      "168587773": "/chains/blast-sepolia.svg", // Blast Sepolia
      "98867": "/chains/zora-sepolia.svg", // Zora Sepolia
      "31337": "/chains/hardhat.svg",      // Hardhat Local
      "1337": "/chains/local.svg"          // Local Ganache/Devnet
    };
  
    return chainIcons[chainId] || "/chains/default.svg";
  }

  export function getChainColor(chainIdString: string): string {
    const chainId = chainIdString.replace("eip155:", "");
  
    const colors: Record<string, string> = {
      "1": "bg-green-500 text-black",        // Ethereum
      "42161": "bg-blue-500 text-white",     // Arbitrum
      "8453": "bg-indigo-500 text-white",    // Base
      "81457": "bg-yellow-500 text-black",   // Blast
      "7887": "bg-pink-500 text-white",      // Kinto
      "11155111": "bg-orange-500 text-black",// Sepolia
      "31337": "bg-gray-500 text-white",     // Hardhat
      "1337": "bg-gray-700 text-white"       // Local
    };
  
    return colors[chainId] || "bg-[#444] text-white"; // Default
  }