import "dotenv/config";
export class Env {
  static APP_NAME = process.env.APP_NAME || "s3_fastify";
  static PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  static JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
  static DATABASE_URL = process.env.DATABASE_URL || "";
  static COOKIE_SECRET = process.env.COOKIE_SECRET || "your_cookie_secret_key";
  static EXPIRE_TOKEN_TIME = process.env.EXPIRE_TIME || "3h";
}
