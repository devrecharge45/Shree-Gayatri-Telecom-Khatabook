import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  appName: string;
  appShortName: string;
  appUrl: string;
}

export interface CompanyConfig {
  name: string;
  phone: string;
  address: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  name: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieSecret: string;
  sessionSecret: string;
}

export class Config {
  private static instance: Config;

  public readonly server: ServerConfig;
  public readonly company: CompanyConfig;
  public readonly database: DatabaseConfig;
  public readonly security: SecurityConfig;

  private constructor() {
    this.server = {
      port: Number(process.env.PORT) || 3000,
      nodeEnv: process.env.NODE_ENV || 'development',
      appName: process.env.APP_NAME || 'Shree Gayatri Telecom Khatabook',
      appShortName: process.env.APP_SHORT_NAME || 'Gayatri Khatabook',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    };

    this.company = {
      name: process.env.COMPANY_NAME || 'Shree Gayatri Telecom',
      phone: process.env.COMPANY_PHONE || '+91 98765 43210',
      address: process.env.COMPANY_ADDRESS || 'Main Market, Station Road, Opp. Telecom Tower'
    };

    this.database = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      pass: process.env.DB_PASSWORD || 'postgres',
      name: process.env.DB_NAME || 'khatabook_db'
    };

    this.security = {
      jwtSecret: process.env.JWT_SECRET || 'super_secure_jwt_signing_key_change_in_production_2026',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      cookieSecret: process.env.COOKIE_SECRET || 'super_secure_cookie_secret_key_change_me',
      sessionSecret: process.env.SESSION_SECRET || 'super_secure_session_secret_key_change_me'
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

export const env = Config.getInstance();
