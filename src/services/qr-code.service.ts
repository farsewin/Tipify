// @ts-ignore - qrcode doesn't have perfect TypeScript support
import QRCode from 'qrcode';

export class QRCodeService {
  private static instance: QRCodeService;

  private constructor() {}

  static getInstance(): QRCodeService {
    if (!QRCodeService.instance) {
      QRCodeService.instance = new QRCodeService();
    }
    return QRCodeService.instance;
  }

  /**
   * Generate QR code as data URL (for embedding in HTML)
   */
  async generateDataURL(url: string, options?: { size?: number }): Promise<string> {
    try {
      const size = options?.size || 300;
      return await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateSVG(url: string, options?: { size?: number }): Promise<string> {
    try {
      const size = options?.size || 300;
      return await QRCode.toString(url, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code SVG: ${error}`);
    }
  }

  /**
   * Generate QR code as PNG buffer
   */
  async generatePNGBuffer(url: string, options?: { size?: number }): Promise<Buffer> {
    try {
      const size = options?.size || 300;
      return await QRCode.toBuffer(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code PNG: ${error}`);
    }
  }

  /**
   * Generate branch tipping URL
   */
  generateBranchTippingUrl(companySlug: string, branchSlug: string, baseUrl: string): string {
    return `${baseUrl}/t/${companySlug}/${branchSlug}`;
  }

  /**
   * Generate staff-specific tipping URL
   */
  generateStaffTippingUrl(staffPublicId: string, baseUrl: string): string {
    return `${baseUrl}/t/staff/${staffPublicId}`;
  }
}

