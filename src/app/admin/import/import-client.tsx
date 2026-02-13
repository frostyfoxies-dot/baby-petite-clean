'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportPreview } from '@/components/admin/import-preview';
import type { ImportPreview as ImportPreviewType } from '@/services/import';
import { previewImportProduct, importProduct } from '@/actions/import';
import { useRouter } from 'next/navigation';

// ============================================
// TYPES & SCHEMAS
// ============================================

const importFormSchema = z.object({
  url: z.string().url('Please enter a valid AliExpress URL'),
  categoryId: z.string().min(1, 'Please select a category'),
});

type ImportFormData = z.infer<typeof importFormSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  markup?: number;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Product Import Page Client Component
 * 
 * Allows admins to import products from AliExpress by URL.
 * Features:
 * - URL input with validation
 * - Category selection
 * - Product preview before import
 * - Import progress tracking
 */
export function ImportClient() {
  const router = useRouter();
  
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [preview, setPreview] = useState<ImportPreviewType | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ImportFormData>({
    resolver: zodResolver(importFormSchema),
  });

  const selectedCategoryId = watch('categoryId');

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Handle preview
  const handlePreview = async (data: ImportFormData) => {
    setError(null);
    setPreview(null);
    setPreviewLoading(true);

    try {
      const result = await previewImportProduct(data.url, data.categoryId);
      
      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        setError(result.error || 'Failed to preview product');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!preview) return;

    setError(null);
    setImportLoading(true);

    try {
      const result = await importProduct(
        preview.aliExpressData.productUrl,
        selectedCategoryId
      );

      if (result.success && result.data) {
        setSuccess(`Product imported successfully! Slug: ${result.data.productSlug}`);
        setPreview(null);
        // Redirect to product page after short delay
        setTimeout(() => {
          router.push(`/products/${result.data?.productSlug}`);
        }, 2000);
      } else {
        setError(result.error || 'Failed to import product');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
        <p className="text-gray-600 mt-1">
          Import products from AliExpress to your store
        </p>
      </div>

      {/* URL Input Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit(handlePreview)} className="space-y-4">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              AliExpress Product URL
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('url')}
                  type="url"
                  id="url"
                  placeholder="https://www.aliexpress.com/item/..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
                />
              </div>
              <Button
                type="submit"
                loading={previewLoading}
                disabled={previewLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>

          {/* Category Select */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
              Target Category
            </label>
            <select
              {...register('categoryId')}
              id="categoryId"
              disabled={categoriesLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'Select a category'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.markup ? `(${category.markup}% markup)` : ''}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Success!</h3>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <ImportPreview
          preview={preview}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={(id) => {
            // Update form value
            const select = document.getElementById('categoryId') as HTMLSelectElement;
            if (select) select.value = id;
          }}
          onImport={handleImport}
          isImporting={importLoading}
        />
      )}
    </div>
  );
}
