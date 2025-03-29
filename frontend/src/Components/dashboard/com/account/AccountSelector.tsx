/** @format */

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
import { IoEye, IoEyeOff } from "react-icons/io5"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { CreateAccountAction } from "@/Actions/AccountActions/CreateAccountAction"

export function AccountSelector() {
  const [selectedAccount, setSelectedAccount] = useState("account1")
  const [eyeOpen, setEyeOpen] = useState(false)
   const initialState = {
     message: "",
     status: 0,
     errors: {},
     data: {},
   }
     const [state, formAction] = useFormState(CreateAccountAction, initialState)
    useEffect(() => {
      if (state.status === 500) {
        toast.error(state.message)
      } else if (state.status === 200) {
        toast.success(state.message)
       
        console.log(state.data)
       
      }
    }, [state])
  const accounts = [
    { id: "account1", name: "Personal Account" },
    { id: "account2", name: "Business Account" },
    { id: "account3", name: "Family Account" },
  ]

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
                />
                <span className="text-red-400">
                  {state.errors?.name?.join(", ")}
                </span>
              </div>

              <div className="mt-4">
                <Label className="my-2" htmlFor="type">
                  Account Type
                </Label>
                <Select name="type">
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
                <span className="text-red-400">
                  {state.errors?.type?.join(", ")}
                </span>
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
                />
                <span className="text-red-400">
                  {state.errors?.income?.join(", ")}
                </span>
              </div>

              

              <div className="flex justify-end space-x-2 pt-4">
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button type="submit">Create Account</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-600">
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
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
