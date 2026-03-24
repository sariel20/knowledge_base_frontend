# 知识库查询系统 - 前端

> 基于 Vue 3 + Element Plus 的知识库 Web 查询界面

## 技术栈

- **Vue 3** - 渐进式前端框架（Composition API）
- **Element Plus** - Vue 3 组件库
- **Vite** - 下一代前端构建工具
- **Axios** - HTTP 客户端

## 功能特性

- 📚 分类筛选（技术笔记、项目记录、学习资料等）
- 🔍 关键字搜索（标题 + 内容模糊匹配）
- 📄 分页展示（10/20/50条可选）
- 💡 笔记详情弹窗
- 📱 响应式布局（适配移动端）
- 🎨 简洁美观的 UI 设计

## 项目结构

```
frontend/
├── src/
│   ├── api/
│   │   └── index.js           # API 调用
│   ├── App.vue                # 主组件
│   ├── main.js                # 入口文件
│   └── assets/                # 静态资源
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 快速开始

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问：http://localhost:5173

### 构建生产版本

```bash
npm run build
```

## API 对接

- 后端服务地址：`http://localhost:8080/api`
- 如需修改，编辑 `src/api/index.js`

## 许可证

MIT