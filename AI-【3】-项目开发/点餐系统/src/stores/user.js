import { defineStore } from 'pinia'
import { login, register, getProfile, updateProfile } from '../api/auth'
import { setToken, removeToken } from '../utils/storage'

export const useUserStore = defineStore('user', {
  state: () => ({ user: null, token: localStorage.getItem('token') || '' }),
  actions: {
    async login(data) {
      const res = await login(data)
      this.token = res.data.token
      this.user = res.data.user
      setToken(res.data.token)
      return res
    },
    async register(data) {
      const res = await register(data)
      this.token = res.data.token
      this.user = res.data.user
      setToken(res.data.token)
      return res
    },
    async fetchProfile() {
      try { this.user = (await getProfile()).data } catch { this.logout() }
    },
    async updateProfile(data) { await updateProfile(data); await this.fetchProfile() },
    logout() { this.user = null; this.token = ''; removeToken(); this.clearCart?.() }
  }
})
