'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check, Facebook, Twitter, Mail, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

/**
 * Registry share component props
 */
export interface RegistryShareProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;
  /**
   * Callback when dialog is closed
   */
  onClose: () => void;
  /**
   * Registry share URL
   */
  shareUrl: string;
  /**
   * Registry title
   */
  registryTitle?: string;
  /**
   * Callback when share is clicked
   */
  onShare?: (platform: 'facebook' | 'twitter' | 'email' | 'link') => void;
}

/**
 * Minimal share options modal
 * 
 * @example
 * ```tsx
 * <RegistryShare
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   shareUrl={`https://kidspetite.com/registry/${shareCode}`}
 *   registryTitle="Baby Smith's Registry"
 *   onShare={(platform) => shareTo(platform)}
 * />
 * ```
 */
export function RegistryShare({
  isOpen,
  onClose,
  shareUrl,
  registryTitle,
  onShare,
}: RegistryShareProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform: 'facebook' | 'twitter' | 'email' | 'link') => {
    onShare?.(platform);
  };

  const getShareUrl = (platform: 'facebook' | 'twitter' | 'email') => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(registryTitle || 'Baby Registry');

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'email':
        return `mailto:?subject=${encodedTitle}&body=Check out our baby registry: ${encodedUrl}`;
      default:
        return shareUrl;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Share Registry</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share URL */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Registry Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Social share buttons */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-3 block">
              Share via
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  window.open(getShareUrl('facebook'), '_blank');
                  handleShare('facebook');
                }}
                leftIcon={<Facebook className="w-4 h-4" />}
              >
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.open(getShareUrl('twitter'), '_blank');
                  handleShare('twitter');
                }}
                leftIcon={<Twitter className="w-4 h-4" />}
              >
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = getShareUrl('email');
                  handleShare('email');
                }}
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Email
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleCopyLink();
                  handleShare('link');
                }}
                leftIcon={<LinkIcon className="w-4 h-4" />}
              >
                Copy Link
              </Button>
            </div>
          </div>

          {/* Info */}
          <Alert variant="info" title="Privacy Note">
            Anyone with this link can view your registry. Share it only with people you trust.
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
