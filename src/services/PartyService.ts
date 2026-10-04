import { Op, WhereOptions, InferAttributes } from 'sequelize';
import { Party } from '../models/Party.model';
import { AppError } from '../utils/AppError';
import { PartyFilter } from '../constants/transaction-types';

export interface PartyQueryParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
}

export interface PartyDashboardStats {
  totalToReceive: number; // You Will Get (+ve balances)
  totalToGive: number; // You Will Give (-ve balances)
  netBalance: number; // totalToReceive - totalToGive
  totalParties: number;
}

export class PartyService {
  /**
   * Get filtered, paginated parties for dashboard
   */
  public static async getParties(params: PartyQueryParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const conditions: WhereOptions<InferAttributes<Party>>[] = [{ user_id: params.userId }];

    // Search by name or mobile number
    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push({
        [Op.or]: [{ name: { [Op.iLike]: term } }, { mobile_no: { [Op.iLike]: term } }]
      });
    }

    // Filter by balance status
    if (params.filter === PartyFilter.GET) {
      conditions.push({ current_balance: { [Op.gt]: 0 } });
    } else if (params.filter === PartyFilter.GIVE) {
      conditions.push({ current_balance: { [Op.lt]: 0 } });
    } else if (params.filter === PartyFilter.SETTLED) {
      conditions.push({ current_balance: 0 });
    }

    const { count, rows } = await Party.findAndCountAll({
      where: { [Op.and]: conditions },
      limit,
      offset,
      order: [['updated_at', 'DESC']]
    });

    return {
      parties: rows,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      limit
    };
  }

  /**
   * Calculate dashboard header summary statistics
   */
  public static async getStats(userId: string): Promise<PartyDashboardStats> {
    const parties = await Party.findAll({
      where: { user_id: userId },
      attributes: ['current_balance']
    });

    let totalToReceive = 0;
    let totalToGive = 0;

    parties.forEach((p) => {
      const bal = Number(p.current_balance) || 0;
      if (bal > 0) {
        totalToReceive += bal;
      } else if (bal < 0) {
        totalToGive += Math.abs(bal);
      }
    });

    return {
      totalToReceive,
      totalToGive,
      netBalance: totalToReceive - totalToGive,
      totalParties: parties.length
    };
  }

  /**
   * Get single party by ID
   */
  public static async getPartyById(partyId: string, userId: string): Promise<Party> {
    const party = await Party.findOne({
      where: { id: partyId, user_id: userId }
    });

    if (!party) {
      throw AppError.notFound('Party not found or access denied');
    }

    return party;
  }

  /**
   * Create a new party
   */
  public static async createParty(
    userId: string,
    data: { name: string; mobile_no?: string; notes?: string }
  ): Promise<Party> {
    return Party.create({
      user_id: userId,
      name: data.name.trim(),
      mobile_no: data.mobile_no ? data.mobile_no.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      current_balance: 0.0
    });
  }

  /**
   * Update an existing party
   */
  public static async updateParty(
    partyId: string,
    userId: string,
    data: { name: string; mobile_no?: string; notes?: string }
  ): Promise<Party> {
    const party = await this.getPartyById(partyId, userId);
    party.name = data.name.trim();
    party.mobile_no = data.mobile_no ? data.mobile_no.trim() : null;
    party.notes = data.notes ? data.notes.trim() : null;
    await party.save();
    return party;
  }

  /**
   * Delete party and its associated ledger transactions
   */
  public static async deleteParty(partyId: string, userId: string): Promise<void> {
    const party = await this.getPartyById(partyId, userId);
    await party.destroy();
  }
}
