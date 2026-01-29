import "dotenv/config";
export class Env {
  static APP_NAME = process.env.APP_NAME || "s3_fastify";
  static PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  static JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
  static DATABASE_URL = process.env.DATABASE_URL || "";
  static COOKIE_SECRET = process.env.COOKIE_SECRET || "your_cookie_secret_key";
  static EXPIRE_TOKEN_TIME = process.env.EXPIRE_TIME || "3h";

  // S3 Configs
  static S3_ENDPOINT = process.env.S3_ENDPOINT || "http://192.168.0.114:9000";
  static S3_REGION = process.env.S3_REGION || "us-east-1";
  static S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
  static S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";
  static S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "uploads";
}
