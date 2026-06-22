import request from '../utils/request'
export const getDishes = (params) => request.get('/dishes', { params })
export const getDish = (id) => request.get(`/dishes/${id}`)
export const adminGetDishes = (params) => request.get('/admin/dishes', { params })
export const createDish = (data) => request.post('/admin/dishes', data)
export const updateDish = (id, data) => request.put(`/admin/dishes/${id}`, data)
export const deleteDish = (id) => request.delete(`/admin/dishes/${id}`)
