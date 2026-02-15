'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryFormData } from '@/lib/validations';
import type { Category } from '@/lib/types';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/data';
import { cn } from '@/lib/utils';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      parentId: '',
      isActive: true,
      position: 0,
    }
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setValue('name', category.name);
      setValue('slug', category.slug);
      setValue('description', category.description || '');
      setValue('image', category.image || '');
      setValue('parentId', category.parentId || '');
      setValue('isActive', category.isActive);
      setValue('position', category.position);
    } else {
      setEditingCategory(null);
      reset({
        name: '',
        slug: '',
        description: '',
        image: '',
        parentId: '',
        isActive: true,
        position: 0,
      });
    }
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setError(null);
    setSuccess(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setError(null);
      setSuccess(null);

      const categoryData = {
        ...data,
        parentId: data.parentId || undefined,
        image: data.image || undefined,
        description: data.description || undefined,
      };

      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, categoryData);
        if (updated) {
          setSuccess('Category updated successfully');
          await fetchCategories();
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          setError('Failed to update category');
        }
      } else {
        const created = await createCategory(categoryData);
        if (created) {
          setSuccess('Category created successfully');
          await fetchCategories();
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          setError('Failed to create category');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteCategory(id);
      if (success) {
        await fetchCategories();
        setDeleteConfirm(null);
        setSuccess('Category deleted successfully');
      } else {
        setError('Failed to delete category');
      }
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const handleGenerateSlug = () => {
    const name = watch('name');
    if (name) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      setValue('slug', slug);
    }
  };

  const {
    watch,
  } = useForm<CategoryFormData>();

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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Organize your products into categories</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Categories Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Slug</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Image</th>
                <th className="table-header-cell">Position</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">{category.name}</td>
                  <td className="table-cell font-mono text-sm text-gray-600">{category.slug}</td>
                  <td className="table-cell max-w-xs truncate">
                    {category.description || '-'}
                  </td>
                  <td className="table-cell">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=No+Image';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="table-cell">{category.position}</td>
                  <td className="table-cell">
                    <span className={cn(
                      'badge',
                      category.isActive ? 'badge-green' : 'badge-gray'
                    )}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="btn-ghost text-sm text-primary-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="btn-ghost text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    No categories yet. Add your first category!
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
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {error && (
                <div className="alert-error">{error}</div>
              )}
              {success && (
                <div className="alert-success">{success}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="label">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="input"
                    onChange={(e) => {
                      register('name').onChange(e);
                      if (!editingCategory) {
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
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={2}
                  className="input"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="image" className="label">
                    Image URL
                  </label>
                  <input
                    {...register('image')}
                    type="url"
                    id="image"
                    className="input"
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Placeholder for Cloudflare R2 upload (future)
                  </p>
                </div>

                <div>
                  <label htmlFor="parentId" className="label">
                    Parent Category
                  </label>
                  <select
                    {...register('parentId')}
                    id="parentId"
                    className="input"
                  >
                    <option value="">None (Top level)</option>
                    {categories
                      .filter(c => c.id !== editingCategory?.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="flex items-center space-x-2 mt-6">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="label">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
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
                Are you sure you want to delete this category? This action cannot be undone.
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
