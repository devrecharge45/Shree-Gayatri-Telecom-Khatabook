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
import { Party } from './Party.model';
import { TransactionType } from '../constants/transaction-types';

export class Transaction extends Model<
  InferAttributes<Transaction>,
  InferCreationAttributes<Transaction>
> {
  declare id: CreationOptional<string>;
  declare party_id: ForeignKey<Party['id']>;
  declare user_id: ForeignKey<User['id']>;
  declare type: TransactionType;
  declare amount: number;
  declare transaction_date: string;
  declare notes: CreationOptional<string | null>;
  declare bill_reference: CreationOptional<string | null>;
  declare balance_after: number;
  declare created_at?: CreationOptional<Date>;
  declare updated_at?: CreationOptional<Date>;

  // Optional associations
  declare party?: NonAttribute<Party>;
  declare user?: NonAttribute<User>;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    party_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'parties',
        key: 'id'
      },
      onDelete: 'CASCADE'
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
    type: {
      type: DataTypes.ENUM(TransactionType.CREDIT, TransactionType.DEBIT),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('amount');
        return val === null ? 0 : typeof val === 'number' ? val : parseFloat(String(val));
      }
    },
    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bill_reference: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    balance_after: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      get() {
        const val = this.getDataValue('balance_after');
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
    tableName: 'transactions',
    indexes: [
      {
        fields: ['party_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['transaction_date']
      }
    ]
  }
);
