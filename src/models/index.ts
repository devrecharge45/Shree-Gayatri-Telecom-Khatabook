import { sequelize } from '../config/database';
import { User } from './User.model';
import { Party } from './Party.model';
import { Transaction } from './Transaction.model';

// User <-> Party
User.hasMany(Party, {
  foreignKey: 'user_id',
  as: 'parties',
  onDelete: 'CASCADE'
});
Party.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Party <-> Transaction
Party.hasMany(Transaction, {
  foreignKey: 'party_id',
  as: 'transactions',
  onDelete: 'CASCADE'
});
Transaction.belongsTo(Party, {
  foreignKey: 'party_id',
  as: 'party'
});

// User <-> Transaction
User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions',
  onDelete: 'CASCADE'
});
Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

export { sequelize, User, Party, Transaction };
