import axios from 'axios'

const api = axios.create({
  // 通过 Vite proxy 走同源 /api，便于局域网访问且避免 CORS
  baseURL: '/api',
  timeout: 10000
})

export function getNotes(params) {
  return api.get('/notes', { params })
}

export function getNoteById(id) {
  return api.get(`/notes/${id}`)
}

export function getCategories() {
  return api.get('/categories')
}

export function createNote(data) {
  return api.post('/notes', data)
}

export function updateNote(id, data) {
  return api.put(`/notes/${id}`, data)
}

export function deleteNote(id) {
  return api.delete(`/notes/${id}`)
}

export function getRecentUpdates(params = {}) {
  return api.get('/notes/recent-updates', { params })
}

export function verifyPassword(password) {
  return api.post('/verify', { password })
}

export function updatePassword(password) {
  return api.put('/password', { password })
}

export function getKeywords() {
  return api.get('/keywords')
}

export function createKeyword(keyword) {
  return api.post('/keywords', { keyword })
}