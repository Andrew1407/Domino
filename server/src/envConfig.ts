export default function config() {
  return {
    port: parseInt(process.env.PORT, 10) || 8080,
    host: process.env.HOST || 'localhost',
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
  };
}
