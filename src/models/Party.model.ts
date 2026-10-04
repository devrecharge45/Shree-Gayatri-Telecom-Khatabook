import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute
} from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User.model';

export class Party extends Model<InferAttributes<Party>, InferCreationAttributes<Party>> {
  declare id: CreationOptional<string>;
  declare user_id: ForeignKey<User['id']>;
  declare name: string;
  declare mobile_no: CreationOptional<string | null>;
  declare notes: CreationOptional<string | null>;
  declare current_balance: CreationOptional<number>;
  declare created_at?: CreationOptional<Date>;
  declare updated_at?: CreationOptional<Date>;

  // Optional loaded association
  declare user?: NonAttribute<User>;
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
      }
    ]
  }
);
