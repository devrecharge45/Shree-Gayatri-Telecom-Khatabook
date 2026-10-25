export class Formatters {
  /**
   * Formats currency as Indian Rupee (₹)
   * Omits trailing .00 for integer amounts to optimize readability on mobile screens,
   * while preserving exact decimals if paise exists (e.g. ₹3,899.50) or if forceDecimals is true.
   */
  public static currency(
    amount: number | string | null | undefined,
    forceDecimals: boolean = false
  ): string {
    const num = Number(amount) || 0;
    const hasDecimals = num % 1 !== 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: hasDecimals || forceDecimals ? 2 : 0,
      maximumFractionDigits: 2
    }).format(num);
  }

  /**
   * Formats absolute number for display with ₹
   */
  public static absoluteCurrency(
    amount: number | string | null | undefined,
    forceDecimals: boolean = false
  ): string {
    const num = Math.abs(Number(amount) || 0);
    return Formatters.currency(num, forceDecimals);
  }

  /**
   * Formats Date to human readable string (e.g. 04 Oct 2026)
   */
  public static date(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Formats Date & Time
   */
  public static dateTime(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Extract initials from name (e.g., "Ramesh Kumar" -> "RK")
   */
  public static initials(name: string): string {
    if (!name) return 'K';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Generates a clean, perfectly aligned WhatsApp share URL for customer passbook login & app install.
   * Centralizing this in TypeScript ensures VS Code / Prettier EJS auto-formatters cannot insert
   * unwanted line wraps, indents, or broken spaces into the message.
   */
  public static passbookWhatsAppShareUrl(options: {
    partyName: string;
    mobileNo: string;
    portalPassword?: string | null;
    companyName: string;
    appUrl?: string | null;
  }): string {
    const rawDigits = (options.mobileNo || '').replace(/[^0-9]/g, '');
    const cleanAppUrl = (options.appUrl || '').replace(/\/+$/, '');
    const loginUrl = `${cleanAppUrl}/portal/login?install=1`;
    const password = options.portalPassword || '(Shopkeeper will provide PIN)';

    const lines: string[] = [
      `Namaste ${options.partyName} ji, 🙏`,
      '',
      `📲 *${options.companyName} - Digital Passbook App*`,
      'Aapka live credit-debit hisaab check karne ke liye mobile app install karein:',
      '',
      '1️⃣ *Direct App Install & Login Link:*',
      `👉 ${loginUrl}`,
      '',
      '2️⃣ *Aapke Login Credentials:*',
      `📱 *Mobile:* ${options.mobileNo}`,
      `🔑 *Password:* ${password}`,
      '',
      '💡 *Tip:* Link open karke *"Install App / Add to Home Screen"* dabayein, app direct aapke phone mein install ho jayegi!'
    ];

    return `https://wa.me/91${rawDigits}?text=${encodeURIComponent(lines.join('\n'))}`;
  }
}
