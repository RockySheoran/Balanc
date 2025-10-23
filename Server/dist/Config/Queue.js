export const redisConnection = {
    host: process.env.REDIS_URL || "localhost",
    port: parseInt(process.env.REDIS_PORT || "11366"),
    password: process.env.REDIS_PASSWORD, // Essential for authenticated Redis
    //   tls: process.env.REDIS_TLS === "true" ? {} : undefined, // For cloud Redis
};
export const defaultJobOptions = {
    removeOnComplete: {
        count: 20,
        age: 60 * 60 // 1 hour - keep completed jobs for 1 hour only
    },
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 3000,
    },
    removeOnFail: {
        count: 10,
        age: 60 * 60 // 1 hour - keep failed jobs for 1 hour only  
    },
};
