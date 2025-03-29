/** @format */
"use client"
import { useEffect, useState } from "react"
import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { CreateAccountAction } from "@/Actions/AccountActions/CreateAccountAction"
import { getAllAccounts } from "@/Actions/AccountActions/getAllAccount"

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
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialState: FormState = {
    message: "",
    status: 0,
    errors: {},
    data: null,
  }

  const [state, formAction] = useFormState(CreateAccountAction, initialState)

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true)
        const response = await getAllAccounts()

        if (response.status !== 200 || !response.data) {
          throw new Error(response.message || "Failed to fetch accounts")
        }

        setAllAccounts(response.data)
        if (response.data.length > 0) {
          setSelectedAccount(response.data[0].id)
        }
      } catch (err) {
        setError(err.message)
        toast.error("Failed to load accounts")
      } finally {
        setIsLoading(false)
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
      // Refresh accounts after successful creation
      if (state.data) {
        setAllAccounts((prev) => [...prev, state.data!])
        setSelectedAccount(state.data.id)
      }
    }
  }, [state])

  const accountTypes = [
    { value: "SAVINGS", label: "Savings" },
    { value: "CHECKING", label: "Checking" },
    { value: "CREDIT", label: "Credit" },
    { value: "INVESTMENT", label: "Investment" },
  ]

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Choose Account
        </h2>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-primary">
                Create New Account
              </DialogTitle>
            </DialogHeader>
            <form action={formAction}>
              <div className="mt-4">
                <Label className="my-2" htmlFor="name">
                  Account Name
                </Label>
                <Input
                  placeholder="e.g., My Savings Account"
                  name="name"
                  id="name"
                  required
                />
                {state.errors?.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {state.errors.name}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <Label className="my-2" htmlFor="type">
                  Account Type
                </Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.type && (
                  <p className="mt-1 text-sm text-red-500">
                    {state.errors.type}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <Label className="my-2" htmlFor="income">
                  Monthly Income (Optional)
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  name="income"
                  id="income"
                  min="0"
                  step="0.01"
                />
                {state.errors?.income && (
                  <p className="mt-1 text-sm text-red-500">
                    {state.errors.income}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="h-10 w-full rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : allAccounts.length === 0 ? (
          <p className="text-gray-500">No accounts available</p>
        ) : (
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-600">
            {allAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
