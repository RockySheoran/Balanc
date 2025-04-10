import { createClient } from 'redis';
const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: 14170, // Replace with your actual port if different
  
  },
})

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
const redisClient = client;
export default redisClient;
await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar
