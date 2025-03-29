/** @format */

// src/store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UserState {
  name: string
  email: string
  image: string
  isAuthenticated: boolean
}

const initialState: UserState = {
  name: "",
  email: "",
  image: "",
  isAuthenticated: false,
}

const userSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ name: string; email: string; image: string }>
    ) => {
      
      return {
        ...state,
        name: action.payload.name,
        email: action.payload.email,
        image: action.payload.image,
        isAuthenticated: true,
      }
    },
    clearUser: () => initialState,
  },
})

export const { setUser, clearUser } = userSlice.actions
export default userSlice.reducer
