/** @format */

import { combineReducers } from "@reduxjs/toolkit"
import userSlice from "./features/user/userInfoSlice"

const rootReducer = combineReducers({
  userInfo: userSlice,
})

export default rootReducer
