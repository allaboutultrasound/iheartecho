export const ENV = {
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "iheartecho",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  aiGatewayUrl: process.env.AI_GATEWAY_URL ?? "",
  aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  thinkificApiKey: process.env.THINKIFIC_API_KEY ?? "",
  thinkificSubdomain: process.env.THINKIFIC_SUBDOMAIN ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
  // Cloudflare R2 storage
  r2Endpoint: process.env.R2_ENDPOINT ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
};
