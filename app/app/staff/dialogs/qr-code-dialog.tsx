'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader, QrCode, Download } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../_components/ui/dialog';
import { Button } from '../../../_components/ui/button';

interface StaffMember {
  id: string;
  branchId: string;
  displayName: string;
  position: string | null;
  avatarUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  companyId: string;
}

interface QRData {
  url: string;
  dataUrl: string;
  svg: string;
}

export default function QRCodeDialog({
  open,
  onOpenChange,
  staff,
  companyId,
}: QRCodeDialogProps) {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-generate QR code when dialog opens
  useEffect(() => {
    if (open && staff) {
      generateQRCode();
    } else if (!open) {
      // Reset state when dialog closes
      setQrData(null);
      setLoading(false);
    }
  }, [open, staff]);

  const generateQRCode = async () => {
    if (!staff) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}/qr?companyId=${companyId}`);
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to generate QR code');
        return;
      }

      if (result.url && result.dataUrl && result.svg) {
        setQrData(result);
      } else {
        toast.error('Invalid QR code response');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrData || !staff) return;

    const link = document.createElement('a');
    link.href = qrData.dataUrl;
    link.download = `${staff.displayName}-qr-code.png`;
    link.click();
  };

  const handleDownloadSVG = () => {
    if (!qrData || !staff) return;

    const svgBlob = new Blob([qrData.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${staff.displayName}-qr-code.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {staff.displayName}</DialogTitle>
          <DialogDescription>
            Scan this QR code to access the staff tipping page
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader className="h-10 w-10 text-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : qrData ? (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                <Image
                  src={qrData.dataUrl}
                  alt={`QR Code for ${staff.displayName}`}
                  width={200}
                  height={200}
                  className="border rounded"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground break-all text-center bg-muted/30 p-2 rounded">
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
                  onClick={generateQRCode}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Regenerate QR Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Failed to generate QR code
              </p>
              <Button onClick={generateQRCode} className="bg-primary hover:bg-primary/90">
                <QrCode className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}