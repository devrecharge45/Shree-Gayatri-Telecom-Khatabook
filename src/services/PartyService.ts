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
    data: {
      name: string;
      mobile_no?: string;
      notes?: string;
      portal_access_enabled?: boolean | string;
      password?: string;
    }
  ): Promise<Party> {
    const cleanName = data.name.trim();
    const cleanMobile = data.mobile_no && data.mobile_no.trim() ? data.mobile_no.trim() : null;
    const cleanNotes = data.notes && data.notes.trim() ? data.notes.trim() : null;
    const isPortalEnabled =
      data.portal_access_enabled === true ||
      data.portal_access_enabled === 'true' ||
      data.portal_access_enabled === 'on';

    // 1. Enforce unique mobile number per admin
    if (cleanMobile) {
      const existing = await Party.findOne({
        where: { user_id: userId, mobile_no: cleanMobile }
      });
      if (existing) {
        throw AppError.badRequest(
          `A party with mobile number "${cleanMobile}" already exists in your Khatabook.`
        );
      }
    }

    // 2. Validate portal access requirements
    let passwordHash: string | null = null;
    let plainPassword: string | null = null;
    if (isPortalEnabled) {
      if (!cleanMobile) {
        throw AppError.badRequest('Mobile number is required to enable Customer Portal access.');
      }
      if (!data.password || data.password.trim().length < 4) {
        throw AppError.badRequest('Portal password must be at least 4 characters long.');
      }
      plainPassword = data.password.trim();
      passwordHash = await Party.hashPassword(plainPassword);
    }

    return Party.create({
      user_id: userId,
      name: cleanName,
      mobile_no: cleanMobile,
      notes: cleanNotes,
      current_balance: 0.0,
      portal_access_enabled: isPortalEnabled,
      password_hash: passwordHash,
      portal_password: plainPassword
    });
  }

  /**
   * Update an existing party
   */
  public static async updateParty(
    partyId: string,
    userId: string,
    data: {
      name: string;
      mobile_no?: string;
      notes?: string;
      portal_access_enabled?: boolean | string;
      password?: string;
    }
  ): Promise<Party> {
    const party = await this.getPartyById(partyId, userId);
    const cleanName = data.name.trim();
    const cleanMobile = data.mobile_no && data.mobile_no.trim() ? data.mobile_no.trim() : null;
    const cleanNotes = data.notes && data.notes.trim() ? data.notes.trim() : null;
    const isPortalEnabled =
      data.portal_access_enabled === true ||
      data.portal_access_enabled === 'true' ||
      data.portal_access_enabled === 'on';

    // 1. Enforce unique mobile per admin (excluding this party)
    if (cleanMobile) {
      const existing = await Party.findOne({
        where: {
          user_id: userId,
          mobile_no: cleanMobile,
          id: { [Op.ne]: partyId }
        }
      });
      if (existing) {
        throw AppError.badRequest(
          `Another party with mobile number "${cleanMobile}" already exists in your Khatabook.`
        );
      }
    }

    // 2. Portal access validation
    if (isPortalEnabled) {
      if (!cleanMobile) {
        throw AppError.badRequest(
          'Mobile number is required when Customer Portal access is enabled.'
        );
      }
      // If a new password is provided, hash and update it
      if (data.password && data.password.trim().length > 0) {
        if (data.password.trim().length < 4) {
          throw AppError.badRequest('Portal password must be at least 4 characters long.');
        }
        const plain = data.password.trim();
        party.portal_password = plain;
        party.password_hash = await Party.hashPassword(plain);
      } else if (!party.password_hash) {
        // If enabling for the first time without an existing password
        throw AppError.badRequest('Please set a portal password to enable Customer Portal access.');
      }
      party.portal_access_enabled = true;
    } else {
      party.portal_access_enabled = false;
    }

    party.name = cleanName;
    party.mobile_no = cleanMobile;
    party.notes = cleanNotes;
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
