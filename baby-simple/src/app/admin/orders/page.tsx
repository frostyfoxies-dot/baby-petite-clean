'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderSchema, orderItemSchema, type OrderFormData, type OrderItemFormData } from '@/lib/validations';
import type { Order, OrderItem, Product, User } from '@/lib/types';
import {
  getOrders,
  getProducts,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
} from '@/lib/data';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const defaultProduct: Product = {
  id: '',
  name: '',
  slug: '',
  price: 0,
  inventory: 0,
  images: [],
  categoryId: '',
  isActive: true,
  isFeatured: false,
  position: 0,
  collectionId: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const statusOptions: Array<Order['status']> = ['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
  const paymentStatusOptions: Array<Order['paymentStatus']> = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
  const shippingStatusOptions: Array<Order['shippingStatus']> = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED'];

  const fetchData = async () => {
    try {
      const [ordersData, productsData] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
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
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      userId: '',
      email: '',
      phone: '',
      shippingName: '',
      shippingAddress1: '',
      shippingAddress2: '',
      shippingCity: '',
      shippingState: '',
      shippingPostal: '',
      shippingCountry: '',
      billingName: '',
      billingAddress1: '',
      billingAddress2: '',
      billingCity: '',
      billingState: '',
      billingPostal: '',
      billingCountry: '',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      shippingStatus: 'PENDING',
      shippingMethod: '',
      trackingNumber: '',
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
      notes: '',
    }
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([{
    productId: '',
    product: { id: '', name: '', slug: '', images: [], price: 0, inventory: 0, isActive: true, isFeatured: false, position: 0, categoryId: '', collectionId: undefined, createdAt: new Date(), updatedAt: new Date() },
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    productName: '',
  }]);

  const watchedOrder = watch();

  useEffect(() => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = subtotal + (watchedOrder.tax || 0) + (watchedOrder.shipping || 0) - (watchedOrder.discount || 0);
    setValue('subtotal', subtotal);
    setValue('total', total);
  }, [orderItems, watchedOrder.tax, watchedOrder.shipping, watchedOrder.discount, setValue]);

  const handleOpenCreateModal = () => {
    setEditingOrder(null);
    setViewOrder(null);
    reset({
      userId: uuidv4(),
      email: '',
      phone: '',
      shippingName: '',
      shippingAddress1: '',
      shippingAddress2: '',
      shippingCity: '',
      shippingState: '',
      shippingPostal: '',
      shippingCountry: '',
      billingName: '',
      billingAddress1: '',
      billingAddress2: '',
      billingCity: '',
      billingState: '',
      billingPostal: '',
      billingCountry: '',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      shippingStatus: 'PENDING',
      shippingMethod: '',
      trackingNumber: '',
      notes: '',
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
    });
    setOrderItems([{
      id: uuidv4(),
      productId: '',
      product: { id: '', name: '', slug: '', images: [], price: 0, inventory: 0, isActive: true, isFeatured: false, position: 0, categoryId: '', collectionId: undefined, createdAt: new Date(), updatedAt: new Date() },
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      productName: '',
    }]);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order);
    setViewOrder(null);
    reset({
      ...order,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
    });
    setOrderItems(order.items.map((item): OrderItem => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: product || {
          ...defaultProduct,
          id: item.productId,
          name: item.productName,
          price: item.unitPrice,
        },
      };
    }));
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleOpenViewModal = (order: Order) => {
    setViewOrder(order);
    setEditingOrder(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setViewOrder(null);
    setError(null);
    setSuccess(null);
    reset();
    setOrderItems([{
      id: uuidv4(),
      productId: '',
      product: { id: '', name: '', slug: '', images: [], price: 0, inventory: 0, isActive: true, isFeatured: false, position: 0, categoryId: '', collectionId: undefined, createdAt: new Date(), updatedAt: new Date() },
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      productName: '',
    }]);
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      setError(null);
      setSuccess(null);

      if (orderItems.length === 0) {
        setError('At least one item is required');
        return;
      }

      const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
      if (validItems.length === 0) {
        setError('Please add at least one valid product');
        return;
      }

      if (editingOrder) {
        const updated = await updateOrder(editingOrder.id, {
          ...data,
          items: validItems,
        });
        if (updated) {
          setSuccess('Order updated successfully');
          await fetchData();
          setTimeout(() => handleCloseModal(), 1000);
        } else {
          setError('Failed to update order');
        }
      } else {
        const user: User = {
          id: data.userId,
          email: data.email,
          role: 'CUSTOMER',
          isActive: true,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const created = await createOrder({
          ...data,
          user,
          items: validItems.map(item => ({
            productId: item.productId,
            product: products.find(p => p.id === item.productId)!,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            productName: item.productName,
          })),
        });
        if (created) {
          setSuccess('Order created successfully');
          await fetchData();
          setTimeout(() => handleCloseModal(), 1000);
        } else {
          setError('Failed to create order');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteOrder(id);
      if (success) {
        await fetchData();
        setDeleteConfirm(null);
        setSuccess('Order deleted successfully');
      } else {
        setError('Failed to delete order');
      }
    } catch (err) {
      setError('Failed to delete order');
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    const updated = updateOrderStatus(orderId, newStatus);
    if (updated) {
      fetchData();
      if (viewOrder?.id === orderId) {
        setViewOrder(updated);
      }
    }
  };

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, {
      id: uuidv4(),
      productId: '',
      product: { id: '', name: '', slug: '', images: [], price: 0, inventory: 0, isActive: true, isFeatured: false, position: 0, categoryId: '', collectionId: undefined, createdAt: new Date(), updatedAt: new Date() },
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      productName: '',
    }]);
  };

  const handleRemoveOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...orderItems];
      newItems[index] = {
        ...newItems[index],
        productId,
        product,
        unitPrice: product.price,
        productName: product.name,
        totalPrice: product.price * newItems[index].quantity,
      };
      setOrderItems(newItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      quantity: Math.max(1, quantity),
      totalPrice: newItems[index].unitPrice * Math.max(1, quantity),
    };
    setOrderItems(newItems);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-yellow';
      case 'PROCESSING': return 'badge-blue';
      case 'SHIPPED': return 'badge-primary';
      case 'DELIVERED': return 'badge-green';
      case 'CANCELLED': return 'badge-red';
      case 'REFUNDED': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter);

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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage and fulfill customer orders</p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'btn-ghost',
            statusFilter === 'all' ? 'bg-gray-200' : ''
          )}
        >
          All ({orders.length})
        </button>
        {statusOptions.map((status) => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'btn-ghost capitalize',
                statusFilter === status ? 'bg-gray-200' : ''
              )}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-container overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Order #</th>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Items</th>
                <th className="table-header-cell">Total</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="table-row">
                  <td className="table-cell font-mono text-sm font-medium">
                    {order.orderNumber}
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-900">{order.email}</p>
                      <p className="text-xs text-gray-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    {order.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="table-cell">
                    <div className="text-sm">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx}>
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-gray-500">+{order.items.length - 2} more</div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell font-medium">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span className={cn('badge', getStatusBadgeClass(order.status))}>
                      {order.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenViewModal(order)}
                        className="btn-ghost text-sm text-primary-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(order)}
                        className="btn-ghost text-sm text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(order.id)}
                        className="btn-ghost text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.map((status) => {
          const count = orders.filter(o => o.status === status).length;
          const total = orders.filter(o => o.status === status).reduce((sum, o) => sum + o.total, 0);
          return (
            <div key={status} className="card p-4">
              <p className="text-sm text-gray-500">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600">${total.toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {/* Create/Edit/View Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {viewOrder ? `Order ${viewOrder.orderNumber}` : editingOrder ? `Edit Order ${editingOrder.orderNumber}` : 'Create New Order'}
              </h2>
            </div>

            <div className="p-6">
              {error && (
                <div className="alert-error mb-4">{error}</div>
              )}
              {success && (
                <div className="alert-success mb-4">{success}</div>
              )}

              {viewOrder ? (
                // View Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Customer Info</h3>
                      <p className="text-sm"><span className="text-gray-600">Email:</span> {viewOrder.email}</p>
                      <p className="text-sm"><span className="text-gray-600">Phone:</span> {viewOrder.phone || '-'}</p>
                      <p className="text-sm"><span className="text-gray-600">User ID:</span> {viewOrder.userId}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
                      <p className="text-sm"><span className="text-gray-600">Order #:</span> {viewOrder.orderNumber}</p>
                      <p className="text-sm"><span className="text-gray-600">Date:</span> {viewOrder.createdAt.toLocaleDateString()}</p>
                      <p className="text-sm"><span className="text-gray-600">Currency:</span> {viewOrder.currency}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <p className="text-sm">
                      {viewOrder.shippingName || '-'}<br/>
                      {viewOrder.shippingAddress1 || ''}<br/>
                      {viewOrder.shippingAddress2 || ''}<br/>
                      {viewOrder.shippingCity || ''}, {viewOrder.shippingState || ''} {viewOrder.shippingPostal || ''}<br/>
                      {viewOrder.shippingCountry || ''}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
                    <div className="card p-4 space-y-2">
                      {viewOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.variantName && <p className="text-sm text-gray-600">{item.variantName}</p>}
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="flex justify-between py-1"><span>Subtotal:</span> <span>${viewOrder.subtotal.toFixed(2)}</span></p>
                      <p className="flex justify-between py-1"><span>Tax:</span> <span>${viewOrder.tax.toFixed(2)}</span></p>
                      <p className="flex justify-between py-1"><span>Shipping:</span> <span>${viewOrder.shipping.toFixed(2)}</span></p>
                      <p className="flex justify-between py-1"><span>Discount:</span> <span>-${viewOrder.discount.toFixed(2)}</span></p>
                      <p className="flex justify-between py-1 font-bold text-lg border-t mt-2 pt-2">
                        <span>Total:</span>
                        <span>${viewOrder.total.toFixed(2)}</span>
                      </p>
                    </div>
                    <div>
                      <div className="mb-2">
                        <label className="label text-sm">Update Status</label>
                        <select
                          value={viewOrder.status}
                          onChange={(e) => handleStatusChange(viewOrder.id, e.target.value as Order['status'])}
                          className="input text-sm"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-sm">Payment Status</label>
                        <p className="text-sm font-medium py-1">{viewOrder.paymentStatus}</p>
                      </div>
                      <div>
                        <label className="label text-sm">Shipping Status</label>
                        <p className="text-sm font-medium py-1">{viewOrder.shippingStatus}</p>
                      </div>
                    </div>
                  </div>

                  {viewOrder.trackingNumber && (
                    <div>
                      <p className="text-sm"><span className="text-gray-600">Tracking Number:</span> {viewOrder.trackingNumber}</p>
                    </div>
                  )}

                  {viewOrder.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Notes</h3>
                      <p className="text-sm text-gray-600">{viewOrder.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Create/Edit Form
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="label">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        id="email"
                        className="input"
                        disabled={!!editingOrder}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="label">Phone</label>
                      <input
                        {...register('phone')}
                        type="tel"
                        id="phone"
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="label">Status <span className="text-red-500">*</span></label>
                      <select {...register('status')} className="input">
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Payment Status</label>
                      <select {...register('paymentStatus')} className="input">
                        {paymentStatusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Shipping Status</label>
                      <select {...register('shippingStatus')} className="input">
                        {shippingStatusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Shipping Method</label>
                      <input
                        {...register('shippingMethod')}
                        type="text"
                        className="input"
                        placeholder="e.g. Standard, Express"
                      />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="label mb-0">Order Items</label>
                      <button
                        type="button"
                        onClick={handleAddOrderItem}
                        className="btn-ghost text-sm text-primary-600"
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex items-end space-x-2 p-3 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <label className="text-sm font-medium">Product</label>
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductChange(index, e.target.value)}
                              className="input"
                              required
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-20">
                            <label className="text-sm font-medium">Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="input"
                              required
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-sm font-medium">Price</label>
                            <input
                              type="text"
                              value={item.unitPrice.toFixed(2)}
                              onChange={(e) => {
                                const newItems = [...orderItems];
                                newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                                newItems[index].totalPrice = newItems[index].unitPrice * newItems[index].quantity;
                                setOrderItems(newItems);
                              }}
                              className="input"
                              step="0.01"
                              required
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-sm font-medium">Total</label>
                            <p className="text-sm py-2 font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                          </div>
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(index)}
                              className="btn-ghost text-red-600 mb-1"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="label">Subtotal</label>
                      <p className="text-sm font-medium py-2">${orderItems.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="label">Tax</label>
                      <input
                        {...register('tax', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Shipping</label>
                      <input
                        {...register('shipping', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Discount</label>
                      <input
                        {...register('discount', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      Total: ${orderItems.reduce((sum, item) => sum + item.totalPrice, 0) + (watchedOrder.tax || 0) + (watchedOrder.shipping || 0) - (watchedOrder.discount || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Shipping & Billing */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                      <div className="space-y-2">
                        <input
                          {...register('shippingName')}
                          type="text"
                          placeholder="Name"
                          className="input"
                        />
                        <input
                          {...register('shippingAddress1')}
                          type="text"
                          placeholder="Address Line 1"
                          className="input"
                        />
                        <input
                          {...register('shippingAddress2')}
                          type="text"
                          placeholder="Address Line 2"
                          className="input"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            {...register('shippingCity')}
                            type="text"
                            placeholder="City"
                            className="input"
                          />
                          <input
                            {...register('shippingState')}
                            type="text"
                            placeholder="State"
                            className="input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            {...register('shippingPostal')}
                            type="text"
                            placeholder="Postal Code"
                            className="input"
                          />
                          <input
                            {...register('shippingCountry')}
                            type="text"
                            placeholder="Country"
                            className="input"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Billing Address</h3>
                      <div className="space-y-2">
                        <input
                          {...register('billingName')}
                          type="text"
                          placeholder="Name"
                          className="input"
                        />
                        <input
                          {...register('billingAddress1')}
                          type="text"
                          placeholder="Address Line 1"
                          className="input"
                        />
                        <input
                          {...register('billingAddress2')}
                          type="text"
                          placeholder="Address Line 2"
                          className="input"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            {...register('billingCity')}
                            type="text"
                            placeholder="City"
                            className="input"
                          />
                          <input
                            {...register('billingState')}
                            type="text"
                            placeholder="State"
                            className="input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            {...register('billingPostal')}
                            type="text"
                            placeholder="Postal Code"
                            className="input"
                          />
                          <input
                            {...register('billingCountry')}
                            type="text"
                            placeholder="Country"
                            className="input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking & Notes */}
                  <div className="space-y-2">
                    <input
                      {...register('trackingNumber')}
                      type="text"
                      placeholder="Tracking Number"
                      className="input"
                    />
                    <textarea
                      {...register('notes')}
                      placeholder="Order notes"
                      rows={2}
                      className="input"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingOrder ? 'Update Order' : 'Create Order')}
                    </button>
                  </div>
                </form>
              )}
            </div>
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
                Are you sure you want to delete this order? This action cannot be undone.
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
