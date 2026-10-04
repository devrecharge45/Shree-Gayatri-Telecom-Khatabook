export class Formatters {
  /**
   * Formats currency as Indian Rupee (₹)
   */
  public static currency(amount: number | string | null | undefined): string {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  /**
   * Formats absolute number for display with ₹
   */
  public static absoluteCurrency(amount: number | string | null | undefined): string {
    const num = Math.abs(Number(amount) || 0);
    return Formatters.currency(num);
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
}
