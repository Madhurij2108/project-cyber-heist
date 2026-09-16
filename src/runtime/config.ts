import dotenv from 'dotenv';

dotenv.config();

export interface RuntimeConfig {
  environment: string;
  port: number;
  apiPort: number;
  frontendPort: number;
  dbPort: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
  isProduction: boolean;
  version: string;
  serviceName: string;
}

export function loadRuntimeConfig(): RuntimeConfig {
  const environment = process.env.AIDLC_ENVIRONMENT || process.env.NODE_ENV || 'local';
  const isProduction = environment === 'production';

  // In containerized deployments, internal ports are fixed:
  // API internal port defaults to 8000 or PORT
  const port = parseInt(process.env.PORT || process.env.API_PORT || '8000', 10);
  const apiPort = parseInt(process.env.API_PORT || process.env.PORT || '8000', 10);
  const frontendPort = parseInt(process.env.FRONTEND_PORT || '3000', 10);
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

  const jwtSecret = process.env.JWT_SECRET || 'cyber-heist-dev-secret-key-32-chars-minimum!';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/cyber_heist';

  return {
    environment,
    port: isNaN(port) ? 8000 : port,
    apiPort: isNaN(apiPort) ? 8000 : apiPort,
    frontendPort: isNaN(frontendPort) ? 3000 : frontendPort,
    dbPort: isNaN(dbPort) ? 5432 : dbPort,
    jwtSecret,
    jwtExpiresIn,
    databaseUrl,
    isProduction,
    version: '0.1.0',
    serviceName: 'project-cyber-heist-api',
  };
}

export const config = loadRuntimeConfig();
