'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/lib/validations';
import type { Product } from '@/lib/types';
import {
  getProducts,
  getCategories,
  getCollections,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/data';
import { cn } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [collections, setCollections] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [prods, cats, cols] = await Promise.all([
        getProducts(),
        getCategories(),
        getCollections(),
      ]);
      setProducts(prods);
      setCategories(cats.map(c => ({ id: c.id, name: c.name })));
      setCollections(cols.map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      sku: '',
      description: '',
      shortDesc: '',
      price: 0,
      salePrice: undefined,
      cost: undefined,
      inventory: 0,
      images: [{ url: '', alt: '', isPrimary: true }],
      categoryId: '',
      collectionId: '',
      isActive: true,
      isFeatured: false,
      position: 0,
    }
  });

  const watchedImages = watch('images');

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue('name', product.name);
      setValue('slug', product.slug);
      setValue('sku', product.sku || '');
      setValue('description', product.description || '');
      setValue('shortDesc', product.shortDesc || '');
      setValue('price', product.price);
      setValue('salePrice', product.salePrice || undefined);
      setValue('cost', product.cost || undefined);
      setValue('inventory', product.inventory);
      setValue('images', product.images);
      setValue('categoryId', product.categoryId);
      setValue('collectionId', product.collectionId || '');
      setValue('isActive', product.isActive);
      setValue('isFeatured', product.isFeatured);
      setValue('position', product.position);
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        slug: '',
        sku: '',
        description: '',
        shortDesc: '',
        price: 0,
        salePrice: undefined,
        cost: undefined,
        inventory: 0,
        images: [{ url: '', alt: '', isPrimary: true }],
        categoryId: '',
        collectionId: '',
        isActive: true,
        isFeatured: false,
        position: 0,
      });
    }
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError(null);
    setSuccess(null);
    reset();
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setError(null);
      setSuccess(null);

      const productData = {
        ...data,
        collectionId: data.collectionId || undefined,
        salePrice: data.salePrice || undefined,
        cost: data.cost || undefined,
        description: data.description || undefined,
        shortDesc: data.shortDesc || undefined,
      };

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, productData);
        if (updated) {
          setSuccess('Product updated successfully');
          await fetchData();
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          setError('Failed to update product');
        }
      } else {
        const created = await createProduct(productData);
        if (created) {
          setSuccess('Product created successfully');
          await fetchData();
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          setError('Failed to create product');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteProduct(id);
      if (success) {
        await fetchData();
        setDeleteConfirm(null);
        setSuccess('Product deleted successfully');
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      setError('Failed to delete product');
    }
  };

  const handleGenerateSlug = () => {
    const name = watch('name');
    if (name) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      setValue('slug', slug);
    }
  };

  const handleImageUrlChange = (index: number, url: string) => {
    const currentImages = watchedImages || [];
    const newImages = [...currentImages];
    newImages[index] = { ...newImages[index], url };
    setValue('images', newImages);
  };

  const handleAddImage = () => {
    const currentImages = watchedImages || [];
    if (currentImages.length < 10) {
      setValue('images', [...currentImages, { url: '', alt: '', isPrimary: false }]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = watchedImages || [];
    if (currentImages.length > 1) {
      const newImages = currentImages.filter((_, i) => i !== index);
      if (newImages.every(img => !img.isPrimary) && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      setValue('images', newImages);
    }
  };

  const handleSetPrimary = (index: number) => {
    const currentImages = watchedImages || [];
    const newImages = currentImages.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setValue('images', newImages);
  };

  const simulateImageUpload = async (file: File): Promise<string> => {
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const url = URL.createObjectURL(file);
    setUploading(false);
    return url;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await simulateImageUpload(file);
        handleImageUrlChange(index, url);
      } catch (err) {
        setError('Failed to upload image');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Image</th>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">SKU</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="table-row">
                  <td className="table-cell">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="table-cell font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="table-cell font-mono text-sm text-gray-600">
                    {product.sku || '-'}
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium">${product.price.toFixed(2)}</p>
                      {product.salePrice && product.salePrice < product.price && (
                        <p className="text-xs text-red-600 line-through">${product.price.toFixed(2)}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={cn(
                      'badge',
                      product.inventory < 10 ? 'badge-red' :
                      product.inventory < 30 ? 'badge-yellow' : 'badge-green'
                    )}>
                      {product.inventory} in stock
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-600">
                    {categories.find(c => c.id === product.categoryId)?.name || 'Uncategorised'}
                  </td>
                  <td className="table-cell">
                    <span className={cn(
                      'badge',
                      product.isActive ? 'badge-green' : 'badge-gray'
                    )}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="btn-ghost text-sm text-primary-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product.id)}
                        className="btn-ghost text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-8 text-gray-500">
                    No products yet. Add your first product!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {error && (
                <div className="alert-error">{error}</div>
              )}
              {success && (
                <div className="alert-success">{success}</div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="label">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="input"
                    onChange={(e) => {
                      register('name').onChange(e);
                      if (!editingProduct) {
                        handleGenerateSlug();
                      }
                    }}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="slug" className="label">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('slug')}
                    type="text"
                    id="slug"
                    className="input"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sku" className="label">
                    SKU
                  </label>
                  <input
                    {...register('sku')}
                    type="text"
                    id="sku"
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="label">
                      Price (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('price', { valueAsNumber: true })}
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      className="input"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="inventory" className="label">
                      Stock Qty <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('inventory', { valueAsNumber: true })}
                      type="number"
                      id="inventory"
                      min="0"
                      className="input"
                    />
                    {errors.inventory && (
                      <p className="text-red-500 text-sm mt-1">{errors.inventory.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="categoryId" className="label">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('categoryId')}
                    id="categoryId"
                    className="input"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="collectionId" className="label">
                    Collection
                  </label>
                  <select
                    {...register('collectionId')}
                    id="collectionId"
                    className="input"
                  >
                    <option value="">None</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="label mb-0">Product Images</label>
                  {watchedImages && watchedImages.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="btn-ghost text-sm text-primary-600"
                    >
                      + Add Image
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Placeholder for Cloudflare R2 upload. Enter URL or simulate file upload.
                </p>
                <div className="space-y-3">
                  {watchedImages?.map((image, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-sm font-medium">Image URL</label>
                          <div className="flex space-x-2">
                            <input
                              type="url"
                              value={image.url}
                              onChange={(e) => handleImageUrlChange(index, e.target.value)}
                              className="input flex-1"
                              placeholder="https://example.com/image.jpg"
                            />
                            <label className="btn-secondary cursor-pointer">
                              {uploading ? 'Uploading...' : 'Upload'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, index)}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Alt Text</label>
                          <input
                            type="text"
                            value={image.alt || ''}
                            onChange={(e) => {
                              const newImages = [...(watchedImages || [])];
                              newImages[index] = { ...newImages[index], alt: e.target.value };
                              setValue('images', newImages);
                            }}
                            className="input"
                            placeholder="Image description"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={image.isPrimary || false}
                              onChange={(e) => handleSetPrimary(index)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="text-sm">Primary Image</span>
                          </label>
                          {watchedImages && watchedImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      {image.url && (
                        <img
                          src={image.url}
                          alt={image.alt || ''}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Error';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {errors.images && (
                  <p className="text-red-500 text-sm mt-1">{errors.images.message as string}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  className="input"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="shortDesc" className="label">
                  Short Description
                </label>
                <textarea
                  {...register('shortDesc')}
                  id="shortDesc"
                  rows={2}
                  className="input"
                  placeholder="Brief product summary for listings"
                />
                {errors.shortDesc && (
                  <p className="text-red-500 text-sm mt-1">{errors.shortDesc.message}</p>
                )}
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="salePrice" className="label">
                    Sale Price
                  </label>
                  <input
                    {...register('salePrice', { valueAsNumber: true })}
                    type="number"
                    id="salePrice"
                    step="0.01"
                    min="0"
                    className="input"
                  />
                  {errors.salePrice && (
                    <p className="text-red-500 text-sm mt-1">{errors.salePrice.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="cost" className="label">
                    Cost Price
                  </label>
                  <input
                    {...register('cost', { valueAsNumber: true })}
                    type="number"
                    id="cost"
                    step="0.01"
                    min="0"
                    className="input"
                  />
                  {errors.cost && (
                    <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="position" className="label">
                    Position
                  </label>
                  <input
                    {...register('position', { valueAsNumber: true })}
                    type="number"
                    id="position"
                    min="0"
                    className="input"
                  />
                  {errors.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    {...register('isFeatured')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting || uploading}>
                  {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
