/** @format */
"use client";

import { useEffect, Suspense, useRef } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import useSWR from "swr";

// Redux imports
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks";
import { clearUser, setUser } from "@/lib/Redux/features/user/userSlice";
import {
  addTransaction,
  clearTransactions,
} from "@/lib/Redux/features/transactions/transactionsSlice";
import {
  addExpense,
  clearExpense,
} from "@/lib/Redux/features/expense/expenseSlice";
import {
  addIncome,
  clearIncome,
} from "@/lib/Redux/features/income/incomeSlices";
import {
  clearAccount,
  previousAccount,
  selectAccount,
  setAccounts,
} from "@/lib/Redux/features/account/accountSlice";
import {
  addInvestments,
  clearInvestments,
} from "@/lib/Redux/features/investmentSlice/investmentSlice";

// API Actions
import { fetchAllTransactions } from "@/Actions/transactionActions/fetchAllTransactions";
import { fetchAllInvestment } from "@/Actions/investmentApi/fetchAllInvestment";
import { getAllAccounts } from "@/Actions/AccountActions/getAllAccount";

interface SessionProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    token?: string;
  } | null;
}

export default function DashboardClient({ session }: SessionProps) {
  const dispatch = useAppDispatch();
  const initializedRef = useRef(false);
  const isRehydratedRef = useRef(false);
  
  // Select data from Redux store
  const { allAccounts, selectedAccount, previousedAccount } = useAppSelector(
    (state) => state.account
  );
  const { transactions, expenseTransactions, incomeTransactions } = useAppSelector(
    (state) => state.transactions
  );
  const { investments } = useAppSelector((state) => state.investments);

  // Check if Redux state is rehydrated
  useEffect(() => {
    const timer = setTimeout(() => {
      isRehydratedRef.current = true;
    }, 100); // Small delay to ensure rehydration
    
    return () => clearTimeout(timer);
  }, []);

  // Determine if we should fetch data
  const shouldFetchAccounts = isRehydratedRef.current && !initializedRef.current && session?.token || !allAccounts?.length;
  // console.log(shouldFetchAccounts, "shouldFetchAccounts")
  const shouldFetchTransactions = isRehydratedRef.current && selectedAccount?.id && 
    (selectedAccount.id !== previousedAccount?.id || !transactions?.length);
  const shouldFetchInvestments = isRehydratedRef.current && selectedAccount?.id && 
    (selectedAccount.id !== previousedAccount?.id || !investments?.length);

  // Accounts fetch - only on initial load after rehydration
  useSWR(
    shouldFetchAccounts ? "accounts" : null,
    async () => {
      const response = await getAllAccounts({ token: session?.token || "" });
      if (response?.status === 404 || !response?.data) {
        throw new Error(response?.message || "Failed to fetch accounts");
      }
      return response.data;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess: (data) => {
        initializedRef.current = true;
        dispatch(setAccounts(data));
        if (!selectedAccount && data?.length > 0) {
          const firstAccountId = data[0]?.id;
          dispatch(selectAccount(firstAccountId));
          dispatch(previousAccount(firstAccountId))


        }
        toast.success("Accounts fetched successfully");
      },
      onError: (err) => {
        console.error("Accounts error:", err);
        toast.error(err.message);
      },
    }
  );

  // Transactions fetch - when account changes or no transactions
  useSWR(
    shouldFetchTransactions ? `/api/transactions/${selectedAccount.id}` : null,
    async () => {
      const response = await fetchAllTransactions({
        accountId: selectedAccount!.id,
      });
      if (response?.status === 404 || !response?.data) {
        throw new Error(response?.message || "Failed to fetch transactions");
      }
      return response.data;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess: (data) => {
        dispatch(clearTransactions());
        data?.transactions?.forEach((transaction: any) => {
          dispatch(addTransaction(transaction));
        });
       
          if (selectedAccount?.id) {
            dispatch(previousAccount(selectedAccount.id));
          }
        toast.success("Transactions fetched successfully");
      },
      onError: (err) => {
        console.error("Transactions error:", err);
        toast.error(err.message);
      },
    }
  );

  // Investments fetch - when account changes or no investments
  useSWR(
    shouldFetchInvestments ? `/api/investment/${selectedAccount.id}` : null,
    async () => {
      const response = await fetchAllInvestment({
        accountId: selectedAccount!.id,
      });
      if (response?.status === 404 || !response?.data) {
        throw new Error(response?.message || "Failed to fetch investments");
      }
      return response.data.investments;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onSuccess: (data) => {
        dispatch(clearInvestments());
        data?.forEach(element  => {
          dispatch(addInvestments(element));
        });
        // if (selectedAccount?.id) {
        //   dispatch(previousAccount(selectedAccount.id));
        // }
        toast.success("Investments fetched successfully");
      },

      onError: (err) => {
        console.error("Investments error:", err);
        toast.error(err.message);
      },
    }
  );

  // Session management
  useEffect(() => {
    if (!session) {
      dispatch(clearUser());
      dispatch(clearIncome());
      dispatch(clearTransactions());
      dispatch(clearExpense());
      dispatch(clearAccount());
      dispatch(clearInvestments());
      signOut({ redirect: true, callbackUrl: "/login" });
    } else {
      dispatch(
        setUser({
          id: null,
          name: session.user?.name || "",
          email: session.user?.email || "",
          token: session.token || "",
        })
      );
    }
  }, [session, dispatch]);

  // Expense transactions update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isRehydratedRef.current) {
        dispatch(clearExpense());
        expenseTransactions.forEach((transaction: any) => {
          dispatch(addExpense(transaction));
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [expenseTransactions, dispatch]);

  // Income transactions update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isRehydratedRef.current) {
        dispatch(clearIncome());
        incomeTransactions?.forEach((transaction: any) => {
          dispatch(addIncome(transaction));
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [incomeTransactions, dispatch]);

  return null;
}

export function DashboardServerWrapper({ session }: SessionProps) {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardClient session={session} />
    </Suspense>
  );
}