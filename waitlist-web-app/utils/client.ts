import { monadTestnet } from "viem/chains";
import { createPublicClient, http } from "viem";

const environment = process.env.NEXT_PUBLIC_APP_ENVIRONMENT;
const rpc =
    environment === "prod"
        ? process.env.NEXT_PUBLIC_MONAD_RPC_URL! ||
          monadTestnet.rpcUrls.default.http[0]
        : monadTestnet.rpcUrls.default.http[0];

export const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(rpc),
});

export const backendUrl = "https://use-crates-backend.up.railway.app/api/v1";