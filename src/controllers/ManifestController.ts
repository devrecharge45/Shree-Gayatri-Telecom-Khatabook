import { Request, Response } from 'express';
import { env } from '../config/environment';

export class ManifestController {
  public static getManifest(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json({
      name: env.server.appName,
      short_name: env.server.appShortName,
      description: `Smart digital ledger for ${env.company.name}`,
      start_url: '/parties',
      display: 'standalone',
      background_color: '#0F172A',
      theme_color: '#1E293B',
      orientation: 'portrait-primary',
      icons: [
        { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
        { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
        { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    });
  }
}
