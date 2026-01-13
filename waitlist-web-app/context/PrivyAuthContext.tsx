"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
interface AuthContextValue {
  address: string;
  user: any;
  authenticated: boolean;
  customizeLogin: () => Promise<void>;
  logout: () => Promise<void>;
}
const PrivyAuthContext = createContext<AuthContextValue | undefined>(undefined);
export const PrivyAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { login } = useLogin();
  const { logout } = useLogout();
  const { user, authenticated } = usePrivy();
  const [address, setAddress] = useState("");

  const customizeLogin = useCallback(async () => {
    try {
      await login();
    } catch (error) {
      return undefined;
    }
  }, [login, address])


  useEffect(() => {
    if (!user) return setAddress("");
    const wallet = user.linkedAccounts.find(
      (account) => account.type === "wallet" && (account.walletClientType === "privy" || account.walletClientType === "metamask") && account.chainType === "ethereum"
    );
    setAddress((wallet as any)?.address || "");
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      address,
      authenticated,
      customizeLogin,
      logout,
    }),
    [user, address, authenticated, customizeLogin, logout]
  );

  return (
    <PrivyAuthContext.Provider value={value}>
      {children}
    </PrivyAuthContext.Provider>
  );
};

export const usePrivyAuth = () => {
  const ctx = useContext(PrivyAuthContext);
  if (!ctx) throw new Error("usePrivyAuth must be used within PrivyAuthProvider");
  return ctx;
};
