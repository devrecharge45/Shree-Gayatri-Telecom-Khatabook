import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
  Op
} from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User } from './User.model';
import { encryptText, decryptText } from '../utils/crypto.util';

export class Party extends Model<InferAttributes<Party>, InferCreationAttributes<Party>> {
  declare id: CreationOptional<string>;
  declare user_id: ForeignKey<User['id']>;
  declare name: string;
  declare mobile_no: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  declare current_balance: CreationOptional<number>;
  declare password_hash: CreationOptional<string | null>;
  declare portal_password: CreationOptional<string | null>;
  declare portal_access_enabled: CreationOptional<boolean>;
  declare created_at?: CreationOptional<Date>;
  declare updated_at?: CreationOptional<Date>;

  // Optional loaded association
  declare user?: NonAttribute<User>;

  /**
   * Verify plain text password against party password_hash
   */
  public async verifyPassword(plainText: string): Promise<boolean> {
    if (!this.password_hash) return false;
    return bcrypt.compare(plainText, this.password_hash);
  }

  /**
   * Hash password before saving
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}

Party.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    mobile_no: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    current_balance: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const val = this.getDataValue('current_balance');
        return val === null ? 0 : typeof val === 'number' ? val : parseFloat(String(val));
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    portal_password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      get() {
        const raw = this.getDataValue('portal_password');
        return decryptText(raw);
      },
      set(val: string | null | undefined) {
        if (!val) {
          this.setDataValue('portal_password', null);
        } else {
          const toStore = val.startsWith('enc:') ? val : encryptText(val);
          this.setDataValue('portal_password', toStore);
        }
      }
    },
    portal_access_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'parties',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['user_id', 'name']
      },
      {
        name: 'parties_user_id_mobile_no_unique',
        unique: true,
        fields: ['user_id', 'mobile_no'],
        where: {
          mobile_no: {
            [Op.ne]: null
          }
        }
      }
    ]
  }
);
