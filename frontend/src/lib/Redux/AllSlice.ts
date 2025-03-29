/** @format */

import { combineReducers } from "@reduxjs/toolkit"
import userSlice from "./features/user/userInfoSlice"

const AllSlice = combineReducers({
  userInfo: userSlice,
})

export default AllSlice
