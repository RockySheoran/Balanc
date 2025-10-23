import { createClient } from 'redis';

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: 11366, // Replace with your actual port if different
  },
})

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
const redisClient = client;

console.log('✅ Redis connected successfully');

export default redisClient;
