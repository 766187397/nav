# 🚀 网站导航项目

一个现代化的网站导航应用，基于 Vue 3 + TypeScript + Vite 构建，提供美观的界面和强大的搜索功能。

## ✨ 功能特性

### 🔍 智能搜索
- **站内搜索**: 快速查找网站资源
- **多引擎支持**: 百度、必应、谷歌搜索引擎切换
- **热门搜索建议**: 智能推荐热门搜索关键词
- **实时搜索**: 输入时实时显示搜索结果

### 🗂️ 网站分类
- **分类导航**: 左侧锚点导航快速定位
- **分类图标**: 每个分类都有独特的图标标识
- **响应式设计**: 完美适配桌面和移动设备

### 🎨 界面设计
- **现代化UI**: 采用现代设计风格
- **平滑动画**: 流畅的过渡效果和交互
- **深色/浅色**: 优雅的色彩方案
- **图标缓存**: 自动缓存网站图标提升加载速度

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式方案**: CSS3 + Flexbox + Grid
- **状态管理**: Vue Reactive API
- **数据存储**: LocalForage (IndexedDB)
- **代码质量**: ESLint + TypeScript

## 📦 安装部署

### 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <项目地址>
   cd nav
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或使用 yarn
   yarn install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或使用 yarn
   yarn dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   # 或使用 yarn
   yarn build
   ```

5. **代码检查**
   ```bash
   npm run lint
   # 或使用 yarn
   yarn lint
   ```

### 部署到生产环境

#### 静态部署 (推荐)
```bash
# 构建生产版本
npm run build

# 部署到任意静态文件服务器
# 构建文件位于 dist/ 目录
```

#### Docker 部署
```dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📖 使用说明

### 基本操作

1. **搜索功能**
   - 在搜索框中输入关键词
   - 按回车或点击搜索按钮
   - 切换搜索引擎标签使用不同搜索引擎

2. **网站导航**
   - 滚动页面查看不同分类的网站
   - 点击左侧导航快速跳转到对应分类
   - 点击网站卡片在新标签页打开网站

3. **图标加载**
   - 应用会自动获取并缓存网站图标
   - 首次加载可能需要一些时间获取图标
   - 图标会缓存在浏览器中提升后续加载速度

### 数据配置

网站数据存储在 `src/data/websites.json` 文件中，格式如下：

```json
{
  "categories": [
    {
      "id": "design",
      "name": "设计资源",
      "icon": "🎨",
      "websites": [
        {
          "name": "站酷",
          "url": "https://www.zcool.com.cn",
          "icon": "",
          "description": "设计师互动平台"
        }
      ]
    }
  ]
}
```

### 自定义配置

1. **修改主题颜色**: 编辑 CSS 变量文件
2. **添加新分类**: 修改 `websites.json` 文件
3. **自定义搜索引擎**: 编辑 `src/utils/searchUtils.ts`
4. **调整布局**: 修改组件样式文件

## 🗂️ 项目结构

```
src/
├── components/          # 组件目录
│   ├── SearchEngine.vue # 搜索组件
│   └── WebsiteNav.vue  # 网站导航组件
├── data/               # 数据目录
│   └── websites.json  # 网站数据
├── types/              # 类型定义
│   └── search.ts       # 搜索相关类型
├── utils/              # 工具函数
│   ├── searchUtils.ts  # 搜索工具
│   └── tool.ts         # 通用工具
├── views/              # 页面视图
│   └── home/           # 首页
└── main.ts            # 应用入口
```

## 🔧 开发指南

### 推荐开发环境

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 扩展
- 禁用 Vetur 扩展（如果已安装）

### TypeScript 支持

项目已配置完整的 TypeScript 支持：
- Vue 3 组合式 API 类型支持
- 组件 Props 类型定义
- 工具函数类型安全
- ESLint 类型检查

### 添加新功能

1. 在相应的组件中添加功能
2. 更新类型定义文件
3. 添加必要的工具函数
4. 编写样式
5. 测试功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Vue 3 团队提供的优秀框架
- Vite 团队提供的高速构建工具
- 所有贡献者和用户

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件到项目维护者

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！