import { defineStore } from 'pinia'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from '../api/cart'

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [], visible: false }),
  getters: {
    count: (state) => state.items.reduce((s, i) => s + i.quantity, 0),
    total: (state) => state.items.reduce((s, i) => s + i.price * i.quantity, 0)
  },
  actions: {
    async fetchCart() {
      if (!localStorage.getItem('token')) return
      try { this.items = (await getCart()).data || [] } catch { this.items = [] }
    },
    async add(dishId, quantity = 1) {
      await addToCart({ dish_id: dishId, quantity })
      await this.fetchCart()
    },
    async update(id, quantity) {
      await updateCartItem(id, { quantity })
      await this.fetchCart()
    },
    async remove(id) { await removeCartItem(id); await this.fetchCart() },
    async clear() { await clearCart(); this.items = [] },
    show() { this.visible = true },
    hide() { this.visible = false }
  }
})
