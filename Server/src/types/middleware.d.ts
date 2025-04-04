/** @format */

import { RequestHandler } from "express"

declare module "express" {
  interface Request {
    // Custom properties if needed
  }

  type AsyncRequestHandler = RequestHandler
}

export {}
