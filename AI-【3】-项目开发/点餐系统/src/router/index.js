import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: () => import('../views/user/Home.vue') },
  { path: '/cart', name: 'Cart', component: () => import('../views/user/Cart.vue'), meta: { requiresAuth: true } },
  { path: '/checkout', name: 'Checkout', component: () => import('../views/user/Checkout.vue'), meta: { requiresAuth: true } },
  { path: '/orders', name: 'Orders', component: () => import('../views/user/Orders.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('../views/user/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/admin/login', name: 'AdminLogin', component: () => import('../views/admin/Login.vue') },
  { path: '/admin', component: () => import('../views/admin/Layout.vue'), meta: { requiresAdmin: true }, children: [
    { path: '', redirect: '/admin/dashboard' },
    { path: 'dashboard', name: 'Dashboard', component: () => import('../views/admin/Dashboard.vue') },
    { path: 'dishes', name: 'AdminDishes', component: () => import('../views/admin/Dishes.vue') },
    { path: 'categories', name: 'AdminCategories', component: () => import('../views/admin/Categories.vue') },
    { path: 'orders', name: 'AdminOrders', component: () => import('../views/admin/Orders.vue') }
  ]},
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const adminToken = localStorage.getItem('adminToken')
  if (to.meta.requiresAuth && !token) return next('/home')
  if (to.meta.requiresAdmin && !adminToken) return next('/admin/login')
  next()
})

export default router
