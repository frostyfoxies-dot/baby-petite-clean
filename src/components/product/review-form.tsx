'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Star, X, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';

/**
 * Review form data type
 */
export interface ReviewFormData {
  /**
   * Reviewer name
   */
  name: string;
  /**
   * Reviewer email
   */
  email: string;
  /**
   * Rating (1-5)
   */
  rating: number;
  /**
   * Review title
   */
  title: string;
  /**
   * Review content
   */
  content: string;
  /**
   * Uploaded images
   */
  images?: File[];
}

/**
 * Review form component props
 */
export interface ReviewFormProps {
  /**
   * Product ID
   */
  productId: string;
  /**
   * Product name
   */
  productName?: string;
  /**
   * Whether the form is open
   */
  isOpen: boolean;
  /**
   * Callback when form is closed
   */
  onClose: () => void;
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: ReviewFormData) => void | Promise<void>;
  /**
   * Whether the form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Submit error message
   */
  error?: string;
  /**
   * Whether to require name and email
   * @default true
   */
  requireUserInfo?: boolean;
  /**
   * Maximum number of images
   * @default 5
   */
  maxImages?: number;
}

/**
 * Review submission form
 * 
 * @example
 * ```tsx
 * <ReviewForm
 *   productId="product-123"
 *   productName="Cute Baby Onesie"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={async (data) => {
 *     await submitReview(data);
 *     setIsOpen(false);
 *   }}
 *   isSubmitting={isSubmitting}
 * />
 * ```
 */
export function ReviewForm({
  productId,
  productName,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
  requireUserInfo = true,
  maxImages = 5,
}: ReviewFormProps) {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [images, setImages] = React.useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: ReviewFormData = {
      name: requireUserInfo ? name : 'Anonymous',
      email: requireUserInfo ? email : '',
      rating,
      title,
      content,
      images: images.length > 0 ? images : undefined,
    };

    await onSubmit(formData);
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoverRating(value);
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, maxImages - images.length);
    
    setImages((prev) => [...prev, ...newImages]);

    // Create previews
    newImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    // Reset form
    setRating(0);
    setName('');
    setEmail('');
    setTitle('');
    setContent('');
    setImages([]);
    setImagePreviews([]);
    onClose();
  };

  const isValid = rating > 0 && title.trim() && content.trim();

  if (requireUserInfo) {
    isValid && name.trim() && email.trim();
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Rating */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Rating <span className="text-yellow">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  onMouseEnter={() => handleRatingHover(value)}
                  onMouseLeave={handleRatingLeave}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`Rate ${value} stars`}
                >
                  <Star
                    className={cn(
                      'w-6 h-6',
                      value <= (hoverRating || rating)
                        ? 'fill-yellow text-yellow'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* User info */}
          {requireUserInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {/* Title */}
          <Input
            label="Review Title"
            placeholder="Summarize your review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Content */}
          <Textarea
            label="Review"
            placeholder="Share your experience with this product"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={1000}
            showCount
            required
          />

          {/* Images */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Photos (optional)
            </label>
            <div className="space-y-3">
              {/* Upload button */}
              {images.length < maxImages && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<Upload className="w-4 h-4" />}
                  >
                    Upload Photos ({images.length}/{maxImages})
                  </Button>
                </div>
              )}

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200"
                    >
                      <img
                        src={preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
