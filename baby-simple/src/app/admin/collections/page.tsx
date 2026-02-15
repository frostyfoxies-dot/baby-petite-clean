'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { collectionSchema, type CollectionFormData } from '@/lib/validations';
import type { Collection } from '@/lib/types';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '@/lib/data';
import { cn } from '@/lib/utils';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
      featured: false,
      position: 0,
      metaTitle: '',
      metaDesc: '',
    }
  });

  const handleOpenModal = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setValue('name', collection.name);
      setValue('slug', collection.slug);
      setValue('description', collection.description || '');
      setValue('image', collection.image || '');
      setValue('isActive', collection.isActive);
      setValue('featured', collection.featured);
      setValue('position', collection.position);
      setValue('metaTitle', collection.metaTitle || '');
      setValue('metaDesc', collection.metaDesc || '');
    } else {
      setEditingCollection(null);
      reset({
        name: '',
        slug: '',
        description: '',
        image: '',
        isActive: true,
        featured: false,
        position: 0,
        metaTitle: '',
        metaDesc: '',
      });
    }
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCollection(null);
    setError(null);
    setSuccess(null);
    reset();
  };

  const onSubmit = async (data: CollectionFormData) => {
    try {
      setError(null);
      setSuccess(null);

      const collectionData = {
        ...data,
        image: data.image || undefined,
        description: data.description || undefined,
        metaTitle: data.metaTitle || undefined,
        metaDesc: data.metaDesc || undefined,
      };

      if (editingCollection) {
        const updated = await updateCollection(editingCollection.id, collectionData);
        if (updated) {
          setSuccess('Collection updated successfully');
          await fetchCollections();
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          setError('Failed to update collection');
        }
      } else {
        const created = await createCollection(collectionData);
        if (created) {
          setSuccess('Collection created successfully');
          await fetchCollections();
          setTimeout(() => {
            handleCloseModal();
          }, 1000);
        } else {
          setError('Failed to create collection');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteCollection(id);
      if (success) {
        await fetchCollections();
        setDeleteConfirm(null);
        setSuccess('Collection deleted successfully');
      } else {
        setError('Failed to delete collection');
      }
    } catch (err) {
      setError('Failed to delete collection');
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
  } = useForm<CollectionFormData>();

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
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600 mt-1">Group products into curated collections</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Collection
        </button>
      </div>

      {/* Collections Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Slug</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Image</th>
                <th className="table-header-cell">Featured</th>
                <th className="table-header-cell">Position</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">{collection.name}</td>
                  <td className="table-cell font-mono text-sm text-gray-600">{collection.slug}</td>
                  <td className="table-cell max-w-xs truncate">
                    {collection.description || '-'}
                  </td>
                  <td className="table-cell">
                    {collection.image ? (
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=No+Image';
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {collection.featured ? (
                      <span className="badge badge-primary">Featured</span>
                    ) : (
                      <span className="badge badge-gray">Normal</span>
                    )}
                  </td>
                  <td className="table-cell">{collection.position}</td>
                  <td className="table-cell">
                    <span className={cn(
                      'badge',
                      collection.isActive ? 'badge-green' : 'badge-gray'
                    )}>
                      {collection.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(collection)}
                        className="btn-ghost text-sm text-primary-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(collection.id)}
                        className="btn-ghost text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {collections.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-8 text-gray-500">
                    No collections yet. Add your first collection!
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
                {editingCollection ? 'Edit Collection' : 'Add New Collection'}
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
                      if (!editingCollection) {
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
                  rows={3}
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
                    Placeholder for Cloudflare R2 upload
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    {...register('featured')}
                    type="checkbox"
                    id="featured"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="label">
                    Featured Collection
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="metaTitle" className="label">
                    Meta Title
                  </label>
                  <input
                    {...register('metaTitle')}
                    type="text"
                    id="metaTitle"
                    className="input"
                    placeholder="SEO title (max 60 chars)"
                    maxLength={60}
                  />
                </div>

                <div>
                  <label htmlFor="metaDesc" className="label">
                    Meta Description
                  </label>
                  <input
                    {...register('metaDesc')}
                    type="text"
                    id="metaDesc"
                    className="input"
                    placeholder="SEO description (max 160 chars)"
                    maxLength={160}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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

                <div className="flex items-center space-x-2 pt-6">
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
                  {isSubmitting ? 'Saving...' : (editingCollection ? 'Update Collection' : 'Create Collection')}
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
                Are you sure you want to delete this collection? This action cannot be undone.
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
