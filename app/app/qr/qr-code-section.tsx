'use client';

import { useState } from 'react';
import { Download, Loader, QrCode } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../_components/ui/card';
import { generateBranchQR, generateStaffQR } from '../actions';
import { toast } from 'sonner';
import Image from 'next/image';

interface QRCodeSectionProps {
  type: 'branch' | 'staff';
  companyId: string;
  id: string;
  name: string;
}

export default function QRCodeSection({
  type,
  companyId,
  id,
  name,
}: QRCodeSectionProps) {
  const [qrData, setQrData] = useState<{
    url: string;
    dataUrl: string;
    svg: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result =
        type === 'branch'
          ? await generateBranchQR(companyId, id)
          : await generateStaffQR(companyId, id);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.url && result?.dataUrl && result?.svg) {
        setQrData(result);
        toast.success('QR code generated!');
      }
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData.dataUrl;
    link.download = `${name}-qr-code.png`;
    link.click();
  };

  const handleDownloadSVG = () => {
    if (!qrData) return;

    const svgBlob = new Blob([qrData.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-qr-code.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>
          {type === 'branch' ? 'Branch QR Code' : 'Staff QR Code'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrData ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <QrCode className="h-12 w-12 text-muted-foreground" />
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate QR Code'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Image
                src={qrData.dataUrl}
                alt={`QR Code for ${name}`}
                width={200}
                height={200}
                className="border rounded"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground break-all">
                {qrData.url}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPNG}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSVG}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  SVG
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrData(null)}
                className="w-full"
              >
                Generate New
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

