import { Sequelize } from 'sequelize';
import { env } from './environment';

export class Database {
  private static instance: Sequelize;

  public static getInstance(): Sequelize {
    if (!Database.instance) {
      Database.instance = new Sequelize(env.database.name, env.database.user, env.database.pass, {
        host: env.database.host,
        port: env.database.port,
        dialect: 'postgres',
        ...(env.server.nodeEnv === 'production' && {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        }),
        logging:
          env.server.nodeEnv === 'development' ? (msg) => console.log(`[SQL] ${msg}`) : false,
        pool: {
          max: 20,
          min: 2,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        }
      });
    }
    return Database.instance;
  }
}

export const sequelize = Database.getInstance();
