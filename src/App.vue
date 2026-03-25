<template>
  <div class="app-container">
    <!-- 登录页 -->
    <div v-if="!isLoggedIn" class="login-page">
      <el-card class="login-card">
        <template #header>
          <div class="login-header">
            <h2>📚 知识库</h2>
            <p>请输入密码访问</p>
          </div>
        </template>
        <el-form @submit.prevent="handleLogin">
          <el-form-item>
            <el-input 
              v-model="loginPassword" 
              type="password" 
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" style="width: 100%" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 主界面 -->
    <div v-else class="main-view">
      <!-- 头部 -->
      <header class="header">
        <div class="header-content">
          <h1 class="title">📚 知识库查询</h1>
          <div class="header-actions">
            <el-button type="success" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              新增笔记
            </el-button>
            <el-button type="warning" @click="showPasswordDialog = true">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-button>
            <el-select 
              v-model="selectedCategory" 
              placeholder="全部分类" 
              clearable
              @change="handleCategoryChange"
            >
              <el-option label="全部分类" value="" />
              <el-option 
                v-for="cat in categories" 
                :key="cat.id" 
                :label="cat.name" 
                :value="cat.name" 
              />
            </el-select>
            <el-input
              v-model="keyword"
              placeholder="搜索标题或内容..."
              class="search-input"
              clearable
              @input="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
          </div>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="main-content">
        <div class="content-wrapper">
          <div class="stats">
            <span>共 {{ total }} 条笔记</span>
            <span v-if="selectedCategory">当前分类：{{ selectedCategory }}</span>
          </div>

          <!-- 笔记列表 - 无限滚动 -->
          <div 
            class="notes-grid" 
            v-loading="loading"
            v-infinite-scroll="loadMoreNotes"
            :infinite-scroll-disabled="!hasMore || isLoadingMore"
            infinite-scroll-distance="100"
          >
            <el-card 
              v-for="note in notes" 
              :key="note.id" 
              class="note-card"
              shadow="hover"
            >
              <template #header>
                <div class="card-header">
                  <el-tag size="small" type="primary">{{ note.category }}</el-tag>
                  <span class="note-title">{{ note.title }}</span>
                  <div class="card-actions">
                    <el-button size="small" type="primary" @click="editNote(note)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button size="small" type="danger" @click="confirmDelete(note)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              <div class="note-content" @click="showDetail(note)">
                {{ truncateContent(note.content) }}
              </div>
              <div class="note-tags" v-if="note.tags">
                <el-tag 
                  v-for="tag in parseTags(note.tags)" 
                  :key="tag" 
                  size="small" 
                  type="info"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="note-footer">
                <span class="source">{{ note.source }}</span>
                <span class="date">{{ note.createdAt }}</span>
              </div>
            </el-card>
          </div>

          <el-empty v-if="!loading && notes.length === 0" description="暂无笔记" />

          <!-- 加载更多提示 -->
          <div class="load-more" v-if="notes.length > 0">
            <span v-if="isLoadingMore">加载中...</span>
            <span v-else-if="!hasMore">没有更多了</span>
          </div>
        </div>
      </main>

      <!-- 详情弹窗 -->
      <el-dialog v-model="detailVisible" :title="currentNote?.title" width="70%" class="detail-dialog">
        <div class="detail-content" v-if="currentNote">
          <div class="detail-header">
            <el-tag>{{ currentNote.category }}</el-tag>
            <span class="detail-date">{{ currentNote.createdAt }}</span>
          </div>
          <div class="detail-tags" v-if="currentNote.tags">
            <el-tag v-for="tag in parseTags(currentNote.tags)" :key="tag" type="info">
              {{ tag }}
            </el-tag>
          </div>
          <div class="detail-body">{{ currentNote.content }}</div>
        </div>
      </el-dialog>

      <!-- 编辑/新增弹窗 -->
      <el-dialog 
        v-model="editDialogVisible" 
        :title="isEditing ? '编辑笔记' : '新增笔记'" 
        width="60%"
      >
        <el-form :model="editForm" label-width="80px">
          <el-form-item label="分类">
            <el-select v-model="editForm.category" placeholder="选择分类">
              <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="editForm.title" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="内容">
            <el-input v-model="editForm.content" type="textarea" :rows="10" placeholder="请输入内容" />
          </el-form-item>
          <el-form-item label="标签">
            <el-select
              v-model="editForm.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入关键字"
              style="width: 100%"
            >
              <el-option
                v-for="kw in keywordList"
                :key="kw.id"
                :label="kw.keyword"
                :value="kw.keyword"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNote">保存</el-button>
        </template>
      </el-dialog>

      <!-- 删除确认 -->
      <el-dialog v-model="deleteVisible" title="确认删除" width="400px">
        <p>确定要删除笔记「{{ deleteTarget?.title }}」吗？</p>
        <template #footer>
          <el-button @click="deleteVisible = false">取消</el-button>
          <el-button type="danger" @click="deleteNote">删除</el-button>
        </template>
      </el-dialog>

      <!-- 修改密码 -->
      <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
        <el-form>
          <el-form-item label="新密码">
            <el-input v-model="newPassword" type="password" placeholder="请输入新密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="updatePassword">确认修改</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getNotes, getCategories, getNoteById, createNote, updateNote, deleteNote as delNote, getKeywords } from './api/index'
import { Search, Plus, Lock, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 登录状态
const isLoggedIn = ref(false)
const loginPassword = ref('')

// 数据
const notes = ref([])
const categories = ref([])
const keywordList = ref([])  // 关键字列表
const loading = ref(false)
const total = ref(0)

const currentPage = ref(1)
const pageSize = ref(20)
const selectedCategory = ref('')
const keyword = ref('')
const isLoadingMore = ref(false)  // 是否正在加载更多
const hasMore = ref(true)  // 是否还有更多数据

const detailVisible = ref(false)
const currentNote = ref(null)

const editDialogVisible = ref(false)
const isEditing = ref(false)
const editForm = ref({ id: null, category: '', title: '', content: '', tags: [] })

const deleteVisible = ref(false)
const deleteTarget = ref(null)

const showPasswordDialog = ref(false)
const newPassword = ref('')
const showAddDialog = ref(false)

// API
const api = axios.create({ baseURL: 'http://localhost:8080/api' })

const verifyPassword = async (pwd) => {
  const res = await api.post('/verify', { password: pwd })
  return res.data.success
}

const updatePasswordApi = async (pwd) => {
  const res = await api.put('/password', { password: pwd })
  return res.data.success
}

// 登录
const handleLogin = async () => {
  if (!loginPassword.value) {
    ElMessage.warning('请输入密码')
    return
  }
  try {
    const success = await verifyPassword(loginPassword.value)
    if (success) {
      isLoggedIn.value = true
      localStorage.setItem('loggedIn', 'true')
      fetchCategories()
      fetchNotes()
    } else {
      ElMessage.error('密码错误')
    }
  } catch (e) {
    ElMessage.error('验证失败')
  }
}

// 修改密码
const updatePassword = async () => {
  if (!newPassword.value) {
    ElMessage.warning('请输入新密码')
    return
  }
  try {
    await updatePasswordApi(newPassword.value)
    ElMessage.success('密码已修改')
    showPasswordDialog.value = false
    newPassword.value = ''
  } catch (e) {
    ElMessage.error('修改失败')
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error('获取分类失败', e)
  }
}

const fetchKeywords = async () => {
  try {
    const res = await getKeywords()
    keywordList.value = res.data || []
  } catch (e) {
    console.error('获取关键字失败', e)
  }
}

const fetchNotes = async (append = false) => {
  if (append) {
    if (isLoadingMore.value || !hasMore.value) return
    isLoadingMore.value = true
  } else {
    loading.value = true
    currentPage.value = 1
    hasMore.value = true
  }
  
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      category: selectedCategory.value || null,
      keyword: keyword.value || null
    }
    const res = await getNotes(params)
    const newNotes = res.data.content || []
    
    if (append) {
      notes.value = [...notes.value, ...newNotes]
    } else {
      notes.value = newNotes
    }
    
    total.value = res.data.total || 0
    hasMore.value = notes.value.length < total.value
    currentPage.value++
  } catch (e) {
    ElMessage.error('获取笔记失败: ' + e.message)
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

// 加载更多笔记
const loadMoreNotes = () => {
  if (hasMore.value && !isLoadingMore.value) {
    fetchNotes(true)
  }
}

const handleCategoryChange = () => {
  currentPage.value = 1
  fetchNotes()
}

let searchTimer = null
const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchNotes()
  }, 300)
}

const showDetail = (note) => {
  currentNote.value = note
  detailVisible.value = true
}

const editNote = (note) => {
  isEditing.value = true
  // 将字符串标签转换为数组
  const tagsArray = note.tags 
    ? note.tags.split(',').map(t => t.trim()).filter(t => t)
    : []
  editForm.value = { 
    id: note.id, 
    category: note.category, 
    title: note.title, 
    content: note.content, 
    tags: tagsArray
  }
  editDialogVisible.value = true
}

const confirmDelete = (note) => {
  deleteTarget.value = note
  deleteVisible.value = true
}

const openAddDialog = () => {
  isEditing.value = false
  editForm.value = { id: null, category: '', title: '', content: '', tags: [] }
  editDialogVisible.value = true
}

const saveNote = async () => {
  if (!editForm.value.category || !editForm.value.title || !editForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  // 将数组转换为逗号分隔的字符串
  const tagsStr = Array.isArray(editForm.value.tags) 
    ? editForm.value.tags.join(',') 
    : editForm.value.tags
  
  const data = {
    ...editForm.value,
    tags: tagsStr
  }
  
  try {
    if (isEditing.value) {
      await updateNote(editForm.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await createNote(data)
      ElMessage.success('创建成功')
    }
    editDialogVisible.value = false
    fetchKeywords()  // 刷新关键字列表
    fetchNotes()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteNote = async () => {
  try {
    await delNote(deleteTarget.value.id)
    ElMessage.success('删除成功')
    deleteVisible.value = false
    fetchNotes()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}

const parseTags = (tags) => {
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(t => t)
}

// 自动生成标签（从关键字表中匹配）
const generateTags = () => {
  const content = editForm.value.content || ''
  const title = editForm.value.title || ''
  const text = title + ' ' + content
  
  // 从关键字表中匹配
  const foundTags = []
  for (const kw of keywordList.value) {
    if (text.includes(kw.keyword) && !foundTags.includes(kw.keyword)) {
      foundTags.push(kw.keyword)
    }
  }
  
  // 如果关键字表没有匹配到，使用常用关键词
  if (foundTags.length === 0) {
    const commonKeywords = [
      'Android', 'Java', 'Kotlin', 'iOS', 'Swift', 'Python', 'Vue', 'React', 'Node.js',
      '微信小程序', 'uniapp', 'Flutter', 'React Native',
      'API', '数据库', 'MySQL', 'Redis', 'MongoDB',
      'Git', 'Docker', 'Kubernetes', 'Linux', 'Nginx',
      '前端', '后端', '全栈', '移动端', 'web',
      '算法', '数据结构', '设计模式', '架构', '性能优化'
    ]
    for (const kw of commonKeywords) {
      if (text.includes(kw) && !foundTags.includes(kw)) {
        foundTags.push(kw)
      }
    }
  }
  
  editForm.value.tags = foundTags
}

// 监听新增笔记对话框
watch(showAddDialog, (newVal) => {
  if (newVal) {
    isEditing.value = false
    editForm.value = { id: null, category: '', title: '', content: '', tags: [] }
    editDialogVisible.value = true
    showAddDialog.value = false
  }
})

// 监听内容变化自动生成标签
watch(() => editForm.value.content, (newContent) => {
  if (!isEditing.value && newContent && newContent.length > 20) {
    generateTags()
  }
})

onMounted(() => {
  // 检查是否已登录
  if (localStorage.getItem('loggedIn') === 'true') {
    isLoggedIn.value = true
    fetchCategories()
    fetchKeywords()
    fetchNotes()
  }
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
.app-container { min-height: 100vh; }

/* 登录页 */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card { width: 400px; }
.login-header { text-align: center; }
.login-header h2 { color: #333; margin-bottom: 10px; }
.login-header p { color: #666; }

/* 头部 */
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.header-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
.title { color: white; font-size: 24px; font-weight: 600; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.search-input { width: 280px; }

/* 内容区 */
.main-content { padding: 20px 0; }
.content-wrapper { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.stats { margin-bottom: 20px; color: #666; font-size: 14px; display: flex; gap: 20px; }

/* 笔记卡片 */
.notes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-bottom: 20px; }
.note-card { cursor: pointer; transition: all 0.3s; }
.note-card:hover { transform: translateY(-4px); }
.card-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.note-title { font-weight: 600; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.card-actions { display: flex; gap: 5px; }
.note-content { color: #666; font-size: 14px; line-height: 1.6; margin: 10px 0; min-height: 60px; }
.note-tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0; }
.tag-item { margin: 0; }
.note-footer { display: flex; justify-content: space-between; font-size: 12px; color: #999; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; }

/* 分页 */
.pagination { display: flex; justify-content: center; padding: 20px 0; }

/* 加载更多 */
.load-more { text-align: center; padding: 20px; color: #999; font-size: 14px; }

/* 详情弹窗 */
.detail-dialog { max-height: 80vh; }
.detail-content { padding: 10px; }
.detail-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
.detail-date { color: #999; font-size: 14px; }
.detail-tags { display: flex; gap: 8px; margin-bottom: 15px; }
.detail-body { line-height: 1.8; color: #333; white-space: pre-wrap; word-break: break-word; max-height: 60vh; overflow-y: auto; padding: 15px; background: #f9f9f9; border-radius: 8px; }

/* 响应式 */
@media (max-width: 768px) {
  .header-content { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; }
  .search-input { width: 100%; }
  .notes-grid { grid-template-columns: 1fr; }
  .detail-dialog { width: 90% !important; }
}
</style>