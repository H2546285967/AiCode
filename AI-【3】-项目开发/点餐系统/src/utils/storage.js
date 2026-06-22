export function setToken(token) { localStorage.setItem('token', token) }
export function getToken() { return localStorage.getItem('token') }
export function removeToken() { localStorage.removeItem('token') }
export function setAdminToken(token) { localStorage.setItem('adminToken', token) }
export function getAdminToken() { return localStorage.getItem('adminToken') }
export function removeAdminToken() { localStorage.removeItem('adminToken') }
