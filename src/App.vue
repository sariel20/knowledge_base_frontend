<template>
  <div class="app-container">
    <!-- 头部 -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">📚 知识库查询</h1>
        <div class="header-actions">
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
        <!-- 笔记统计 -->
        <div class="stats">
          <span>共 {{ total }} 条笔记</span>
          <span v-if="selectedCategory">当前分类：{{ selectedCategory }}</span>
        </div>

        <!-- 笔记列表 -->
        <div class="notes-grid" v-loading="loading">
          <el-card 
            v-for="note in notes" 
            :key="note.id" 
            class="note-card"
            shadow="hover"
            @click="showDetail(note)"
          >
            <template #header>
              <div class="card-header">
                <el-tag size="small" type="primary">{{ note.category }}</el-tag>
                <span class="note-title">{{ note.title }}</span>
              </div>
            </template>
            <div class="note-content">
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

        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && notes.length === 0" 
          description="暂无笔记，请尝试其他搜索条件" 
        />

        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </main>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="currentNote?.title"
      width="70%"
      class="detail-dialog"
    >
      <div class="detail-content" v-if="currentNote">
        <div class="detail-header">
          <el-tag>{{ currentNote.category }}</el-tag>
          <span class="detail-date">{{ currentNote.createdAt }}</span>
        </div>
        <div class="detail-tags" v-if="currentNote.tags">
          <el-tag 
            v-for="tag in parseTags(currentNote.tags)" 
            :key="tag" 
            type="info"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div class="detail-body">
          {{ currentNote.content }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNotes, getCategories } from './api/index'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 数据
const notes = ref([])
const categories = ref([])
const loading = ref(false)
const total = ref(0)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选
const selectedCategory = ref('')
const keyword = ref('')

// 详情
const detailVisible = ref(false)
const currentNote = ref(null)

// 获取分类
const fetchCategories = async () => {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error('获取分类失败', e)
  }
}

// 获取笔记列表
const fetchNotes = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      category: selectedCategory.value || null,
      keyword: keyword.value || null
    }
    const res = await getNotes(params)
    notes.value = res.data.content || []
    total.value = res.data.total || 0
  } catch (e) {
    ElMessage.error('获取笔记失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// 处理分类筛选
const handleCategoryChange = () => {
  currentPage.value = 1
  fetchNotes()
}

// 处理搜索（防抖）
let searchTimer = null
const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchNotes()
  }, 300)
}

// 分页大小变化
const handleSizeChange = () => {
  currentPage.value = 1
  fetchNotes()
}

// 页码变化
const handlePageChange = () => {
  fetchNotes()
}

// 显示详情
const showDetail = (note) => {
  currentNote.value = note
  detailVisible.value = true
}

// 截取内容
const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}

// 解析标签
const parseTags = (tags) => {
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(t => t)
}

// 初始化
onMounted(() => {
  fetchCategories()
  fetchNotes()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
}

/* 头部 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.title {
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

/* 内容区 */
.main-content {
  padding: 20px 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.stats {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
  display: flex;
  gap: 20px;
}

/* 笔记卡片 */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.note-card {
  cursor: pointer;
  transition: all 0.3s;
}

.note-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.note-title {
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-content {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 10px 0;
  min-height: 60px;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 10px 0;
}

.tag-item {
  margin: 0;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 详情弹窗 */
.detail-dialog {
  max-height: 80vh;
}

.detail-content {
  padding: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.detail-date {
  color: #999;
  font-size: 14px;
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.detail-body {
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  .notes-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-dialog {
    width: 90% !important;
  }
}
</style>