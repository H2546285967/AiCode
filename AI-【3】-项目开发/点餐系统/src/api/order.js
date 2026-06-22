import request from '../utils/request'
export const createOrder = (data) => request.post('/orders', data)
export const getOrders = () => request.get('/orders')
export const getOrder = (id) => request.get(`/orders/${id}`)
export const adminGetOrders = (params) => request.get('/admin/orders', { params })
export const updateOrderStatus = (id, status) => request.put(`/admin/orders/${id}/status`, { status })
