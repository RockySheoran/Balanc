/** @format */
"use client"
import { useActionState, useEffect, useState } from "react"
import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/Components/ui/dialog"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"
import { CreateAccountAction } from "@/Actions/AccountActions/CreateAccountAction"
import { getAllAccounts } from "@/Actions/AccountActions/getAllAccount"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import {
  addAccount,
  selectAccount,
  setAccounts,
  deleteAccount,
} from "@/lib/Redux/features/account/accountSlice"
import { PlusIcon, ChevronDownIcon, Trash2Icon } from "./Icons"
import { Skeleton } from "@/Components/ui/skeleton"
import { deleteAccountAction } from "@/Actions/AccountActions/deleteAccountAction"

interface Account {
  id: string
  name: string
  type: string
  income?: number
}

interface FormState {
  message: string
  status: number
  errors: Record<string, string[]>
  data: Account | null
}

export function AccountSelector() {
  const dispatch = useAppDispatch()
  const { allAccounts, selectedAccount, isLoading, error } = useAppSelector(
    (state) => state.account
  )
  const { pending } = useFormStatus()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const initialState: FormState = {
    message: "",
    status: 0,
    errors: {},
    data: null,
  }
  const { selectedAccount: currentSelectedAccount } = useAppSelector((store) => store.account)

  const [state, formAction] = useActionState(CreateAccountAction, initialState)

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await getAllAccounts()
        if (response.status !== 200 || !response.data) {
          throw new Error(response.message || "Failed to fetch accounts")
        }
        dispatch(setAccounts(response.data))
        if (response.data.length > 0) {
         if (selectedAccount == null) {
          console.log("asddwfwfwsefsdwdfwsdfdfd")
           dispatch(selectAccount(response.data[0].id))
         }
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "An unknown error occurred"
        )
      }
    }

    fetchAccounts()
  }, [])

  // Handle form state changes
  useEffect(() => {
    if (state.status === 500) {
      toast.error(state.message)
    } else if (state.status === 200) {
      toast.success(state.message)
      if (state.data) {
        dispatch(addAccount(state.data))
        
        dispatch(selectAccount(state.data.id))
      }
    }
  }, [state, dispatch])

  const accountTypes = [
    { value: "SAVINGS", label: "Savings", color: "text-emerald-500" },
    { value: "CHECKING", label: "Checking", color: "text-blue-500" },
    { value: "CREDIT", label: "Credit", color: "text-amber-500" },
    { value: "INVESTMENT", label: "Investment", color: "text-purple-500" },
  ]

  const getTypeColor = (type: string) => {
    return accountTypes.find((t) => t.value === type)?.color || "text-gray-500"
  }

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return

    try {
      const response = await deleteAccountAction({
        accountId: selectedAccount.id,
      })
      if (response.status === 200) {
        dispatch(deleteAccount(selectedAccount.id))
        toast.success(`Account "${selectedAccount.name}" deleted successfully`)

        // Select another account if available
        if (allAccounts.length > 1) {
          const remainingAccounts = allAccounts.filter(
            (acc) => acc.id !== selectedAccount.id
          )
          if (remainingAccounts.length > 0) {
            dispatch(selectAccount(remainingAccounts[0].id))
          }
        }
      } else {
        throw new Error(response.message || "Failed to delete account")
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      )
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="w-full p-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Account Management
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="w-full cursor-pointer sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                <PlusIcon className="mr-2 h-4 w-4" />
                <span>New Account</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary cursor-pointer">
                  Create New Account
                </DialogTitle>
              </DialogHeader>
              <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-gray-700 dark:text-gray-300">
                    Account Name
                  </Label>
                  <Input
                    placeholder="e.g., My Savings Account"
                    name="name"
                    id="name"
                    required
                    className="focus:ring-2 focus:ring-primary/50"
                  />
                  {state.errors?.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {state.errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="type"
                    className="text-gray-700 dark:text-gray-300">
                    Account Type
                  </Label>
                  <Select name="type" required>
                    <SelectTrigger className="w-full focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border border-gray-200 dark:border-gray-700 shadow-lg">
                      {accountTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className={`${type.color} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.errors?.type && (
                    <p className="text-sm text-red-500 mt-1">
                      {state.errors.type}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="income"
                    className="text-gray-700 dark:text-gray-300">
                    Monthly Income (Optional)
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    name="income"
                    id="income"
                    min="0"
                    step="0.01"
                    value="0"
                    readOnly
                    className="focus:ring-2 focus:ring-primary/50 bg-gray-100"
                  />
                  {state.errors?.income && (
                    <p className="text-sm text-red-500 mt-1">
                      {state.errors.income}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <Button
                    type="submit"
                    disabled={pending}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all">
                    {pending ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {selectedAccount && (
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={allAccounts.length <= 1}
                  className="w-full sm:w-auto cursor-pointer shadow-md hover:shadow-lg transition-shadow">
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  <span>Delete Account</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-destructive">
                    Delete Account
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this account? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                {selectedAccount && (
                  <div className="py-4">
                    <h4 className="font-medium text-destructive mb-2">
                      Account to be deleted:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        Name:
                      </div>
                      <div className="font-medium">{selectedAccount.name}</div>

                      <div className="text-gray-600 dark:text-gray-400">
                        Type:
                      </div>
                      <div
                        className={`font-medium ${getTypeColor(
                          selectedAccount.type
                        )}`}>
                        {selectedAccount.type}
                      </div>

                      {selectedAccount.income && (
                        <>
                          <div className="text-gray-600 dark:text-gray-400">
                            Income:
                          </div>
                          <div className="font-medium">
                            ${selectedAccount.income.toFixed(2)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Account Selection Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Select Account
        </h3>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : allAccounts.length === 0 ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 text-center">
            <p className="text-blue-600 dark:text-blue-400">
              No accounts available. Create your first account!
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedAccount?.id || ""}
              onChange={(e) => dispatch(selectAccount(e.target.value))}
              className="appearance-none block w-full px-4 py-3 pr-10 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer">
              {allAccounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                  className={`${getTypeColor(
                    account.type
                  )} bg-white dark:bg-gray-800`}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Account Details Section */}
      {selectedAccount && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-800 dark:text-white mb-2">
            Selected Account Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2  gap-3 md:gap-28">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {selectedAccount.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span
                  className={`font-medium ${getTypeColor(
                    selectedAccount.type
                  )}`}>
                  {selectedAccount.type}
                </span>
              </div>
            </div>
            {selectedAccount.income && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Income:
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    ${selectedAccount.income.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
