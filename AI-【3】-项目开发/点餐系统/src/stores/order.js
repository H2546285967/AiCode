import { defineStore } from 'pinia'
import { getOrders } from '../api/order'

export const useOrderStore = defineStore('order', {
  state: () => ({ orders: [] }),
  actions: {
    async fetchOrders() { this.orders = (await getOrders()).data || [] }
  }
})
