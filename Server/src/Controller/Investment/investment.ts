/** @format */
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { investmentSchema } from "../../Validation/investmentValidation.js";
import { formatError } from "../../helper.js";
import { createClient } from "redis";
import prisma from "../../Config/DataBase.js";
import redisClient from "../../Config/redis/redis.js";

// Cache TTL (1 hour)
const CACHE_TTL_SECONDS = 60 * 60;

// 🎯 Create Investment (with cache invalidation)
export const createInvestment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const userId = req.user.id;
    const data = req.body;
    // const payload = await investmentSchema.parse(data);

    const investment = await prisma.investment.create({
      data: {
        accountId: data.accountId,
        userId,
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        amount: data.currentPrice * data.quantity,
        quantity: data.quantity,
        buyDate: new Date(data.buyDate),
        buyPrice: data.currentPrice,
        sellPrice: data.sellPrice || null,
        sellDate: null,
        currentValue: data.currentPrice,
      },
    });

    // Invalidate cache for this account's investments
    const cacheKey = `investments:${data.accountId}`;
    await redisClient.del(cacheKey);

    res.status(201).json({
      message: "Investment created successfully",
      data: { investment },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = await formatError(error);
      res.status(422).json({ message: "Invalid Data", errors });
      return;
    }
    console.error(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// 📈 Get All Investments (with Redis caching)
export const getAllInvestments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      res.status(400).json({ message: "Account ID is required" });
      return;
    }

    const cacheKey = `investments:${accountId}`;

    // Check cache first
    const cachedInvestments = await redisClient.get(cacheKey);
    if (cachedInvestments) {
      res.status(200).json({
        message: "Investments retrieved from cache",
        data: { investments: JSON.parse(cachedInvestments) },
      });
      return;
    }

    // Cache miss - fetch from database
    const investments = await prisma.investment.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });

    // Cache the result
    await redisClient.setEx(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(investments)
    );

    res.status(200).json({
      message: "Data retrieved from database",
      data: { investments },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Data not Found",
      error: (error as Error).message,
    });
  }
};

// 🗑️ Delete Investment (with cache invalidation)
export const deleteInvestment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const userId = req.user.id;
    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment || investment.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Investment not found or unauthorized",
      });
      return;
    }

    await prisma.investment.delete({ where: { id } });

    // Invalidate cache for this account's investments
    const cacheKey = `investments:${investment.accountId}`;
    await redisClient.del(cacheKey);

    res.status(200).json({
      success: true,
      message: "Investment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

// ✏️ Update Investment (with cache invalidation)
export const updateInvestment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const investment = await prisma.investment.findUnique({
      where: { id: data.id },
    });

    if (!investment) {
      res.status(404).json({
        success: false,
        message: "Investment not found or unauthorized",
      });
      return;
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id: data.id },
      data: {
        sellDate: data.sellDate ? new Date(data.sellDate) : null,
        sellPrice: data.sellPrice || null,
      },
    });

    // Invalidate cache for this account's investments
    const cacheKey = `investments:${investment.accountId}`;
    await redisClient.del(cacheKey);

    res.status(200).json({
      success: true,
      message: "Investment updated successfully",
      investment: updatedInvestment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};