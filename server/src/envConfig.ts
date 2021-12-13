export default function config() {
  return {
    port: parseInt(process.env.PORT, 10) || 8080,
    host: process.env.HOST || 'localhost'
  };
}
