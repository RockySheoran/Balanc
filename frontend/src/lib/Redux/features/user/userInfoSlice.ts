/** @format */

// src/store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UserState {
  name: string
  email: string
  image: string
}

const initialState: UserState = {
  name: "",
  email: "",
  image: "",
}

const userSlice = createSlice({
  name: "userInfo",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.name = action.payload.name
      state.email = action.payload.email
      state.image = action.payload.image
    },
  },
})

export const { setUser } = userSlice.actions

export default userSlice.reducer
