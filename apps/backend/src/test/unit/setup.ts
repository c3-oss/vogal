export const setup = async () => {
  process.env.__USE_PGLITE = '1'
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
}
