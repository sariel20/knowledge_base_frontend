import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000
})

// 获取笔记列表（分页、筛选、搜索）
export function getNotes(params) {
  return api.get('/notes', { params })
}

// 获取笔记详情
export function getNoteById(id) {
  return api.get(`/notes/${id}`)
}

// 获取分类列表
export function getCategories() {
  return api.get('/categories')
}