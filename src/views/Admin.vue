<template>
  <div class="admin-container">
    <div class="admin-content">
      <!-- 左侧导航 -->
      <div class="admin-sidebar">
        <nav class="admin-nav">
          <h3>管理导航</h3>
          <ul>
            <li>
              <router-link to="/" class="nav-link">
                <span class="nav-icon">🏠</span>
                返回首页
              </router-link>
            </li>
            <li>
              <a href="#" class="nav-link" @click.prevent="showAllWebsites">
                <span class="nav-icon">📋</span>
                所有网站
              </a>
            </li>
            <li>
              <a href="#" class="nav-link" @click.prevent="addNewWebsite">
                <span class="nav-icon">➕</span>
                添加网站
              </a>
            </li>
            <li>
              <a href="#" class="nav-link" @click.prevent="openAddCategoryModal">
                <span class="nav-icon">➕</span>
                新增分类
              </a>
            </li>
          </ul>

          <!-- 分类筛选 -->
          <div class="category-filter" v-if="filteredCategories.length > 0">
            <h4>分类筛选 <small>(拖拽排序)</small></h4>
            <draggable
              v-model="categories"
              tag="div"
              class="category-tags"
              item-key="id"
              @end="onCategoryDragEnd"
              @start="isDragging = true">
              <template #item="{ element: category }">
                <div :class="['category-tag-wrapper', { active: selectedCategory === category.id }]">
                  <span class="drag-handle" title="拖拽排序">↕️</span>
                  <span class="category-tag" @click="toggleCategoryFilter(category.id)">
                    {{ category.icon }} {{ category.name }}
                  </span>
                  <button
                    v-if="category.id !== 'default'"
                    @click.stop="editCategory(category)"
                    class="category-edit-btn"
                    title="编辑分类">
                    ✏️
                  </button>
                  <button
                    v-if="category.id !== 'default'"
                    @click.stop="confirmDeleteCategory(category.id)"
                    class="category-delete-btn"
                    title="删除分类">
                    ❌
                  </button>
                </div>
              </template>
            </draggable>
          </div>
        </nav>
      </div>

      <!-- 右侧内容区域 -->
      <div class="admin-main">
        <!-- 操作工具栏 -->
        <div class="admin-toolbar">
          <div class="toolbar-left">
            <h2 v-if="!isEditing">网站管理</h2>
            <h2 v-else>{{ editingWebsite ? "编辑网站" : "添加网站" }}</h2>
          </div>
          <div class="toolbar-right">
            <button v-if="!isEditing" @click="exportData" class="btn btn-info">📤 导出数据</button>
            <button v-if="!isEditing" @click="showImportModal = true" class="btn btn-success">
              📥 导入数据
            </button>
            <!-- <button v-if="!isEditing" @click="addNewWebsite" class="btn btn-primary">➕ 添加网站</button> -->
            <button v-if="!isEditing" @click="showResetConfirm = true" class="btn btn-warning">
              🔄 重置数据
            </button>
            <button v-if="isEditing" @click="cancelEdit" class="btn btn-secondary">↩️ 取消</button>
          </div>
        </div>

        <!-- 顶部搜索区域 -->
        <div class="admin-header">
          <div class="search-container">
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索网站进行编辑..."
                @keyup.enter="handleAdminSearch"
                class="search-input" />
              <button @click="handleAdminSearch" class="search-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 编辑表单 -->
        <div class="edit-form" v-if="isEditing">
          <form @submit.prevent="saveWebsite">
            <div class="form-group">
              <label>网站URL</label>
              <input
                v-model="editForm.url"
                type="url"
                placeholder="https://example.com"
                @blur="fetchWebsiteMeta"
                required />
            </div>
            <div class="form-group">
              <label>网站名称</label>
              <input v-model="editForm.name" type="text" placeholder="输入网站名称" required />
            </div>
            <div class="form-group">
              <label>网站图标URL</label>
              <input v-model="editForm.icon" type="url" placeholder="https://example.com/favicon.ico" />
            </div>
            <div class="form-group">
              <label>网站描述</label>
              <textarea v-model="editForm.description" placeholder="输入网站描述" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="block">所属分类</label>
              <div class="select">
                <select v-model="editForm.categoryId" class="">
                  <option value="">请选择分类</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.icon }} {{ category.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="saveStatus === 'saving' || deleteStatus === 'deleting'">
                <span v-if="saveStatus === 'saving'">⏳ 保存中...</span>
                <span v-else-if="saveStatus === 'success'">✅ 保存成功</span>
                <span v-else>💾 保存</span>
              </button>

              <button
                type="button"
                @click="cancelEdit"
                class="btn btn-secondary"
                :disabled="saveStatus === 'saving' || deleteStatus === 'deleting'">
                ❌ 取消
              </button>

              <button
                v-if="editingWebsite"
                type="button"
                @click="deleteWebsite"
                class="btn btn-danger"
                :disabled="saveStatus === 'saving' || deleteStatus === 'deleting'">
                <span v-if="deleteStatus === 'deleting'">⏳ 删除中...</span>
                <span v-else-if="deleteStatus === 'success'">✅ 删除成功</span>
                <span v-else>🗑️ 删除</span>
              </button>

              <!-- 错误提示 -->
              <div v-if="saveStatus === 'error'" class="error-message floating-error">
                ❌ {{ errorMessage || "保存失败，请重试" }}
              </div>
              <div v-if="deleteStatus === 'error'" class="error-message floating-error">
                ❌ 删除失败，请重试
              </div>
            </div>
          </form>
        </div>

        <!-- 网站列表 -->
        <div v-else class="website-list">
          <div class="list-header">
            <h3>网站列表</h3>
            <div class="total-count">共 {{ filteredWebsites.length }} 个网站</div>
            <div v-if="searchQuery" class="search-status">搜索到 {{ filteredWebsites.length }} 个结果</div>
          </div>

          <div v-if="filteredWebsites.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>没有找到网站</h3>
            <p v-if="searchQuery">请尝试其他搜索关键词</p>
            <p v-else>当前没有网站数据</p>
          </div>

          <div v-else>
            <!-- 按分类分组显示 -->
            <div v-for="category in filteredCategories" :key="category.id" class="category-section">
              <div class="category-header">
                <h4 class="category-title">
                  <span class="title-icon">{{ category.icon }}</span>
                  {{ category.name }}
                </h4>
                <div class="category-count">{{ category.websites.length }} 个网站</div>
              </div>

              <draggable
                v-model="category.websites"
                tag="div"
                class="websites-grid"
                item-key="name"
                @end="onWebsiteDragEnd(category.id)"
                @start="isDragging = true">
                <template #item="{ element: website }">
                  <div
                    class="website-item"
                    @click="
                      editWebsite({ ...website, category: category.name, categoryIcon: category.icon })
                    ">
                    <div class="drag-handle" title="拖拽排序">↕️</div>
                    <div class="website-icon">
                      <img
                        :src="website.icon"
                        :alt="website.name"
                        @error="(event) => handleImageError(event, website)" />
                    </div>
                    <div class="website-info">
                      <h4>{{ website.name }}</h4>
                      <p class="website-url">{{ website.url }}</p>
                      <p class="website-desc">{{ website.description }}</p>
                      <div class="website-meta">
                        <span class="category">{{ category.name }}</span>
                      </div>
                    </div>
                    <div class="website-actions">
                      <button
                        class="btn-edit"
                        @click.stop="
                          editWebsite({ ...website, category: category.name, categoryIcon: category.icon })
                        ">
                        ✏️
                      </button>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <div v-if="showResetConfirm" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>⚠️ 确认重置</h3>
        </div>
        <div class="modal-body">
          <p>确定要重置所有数据到初始状态吗？这将删除所有修改！</p>
        </div>
        <div class="modal-actions">
          <button @click="resetToDefault" class="btn btn-danger">确认重置</button>
          <button @click="showResetConfirm = false" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
    <!-- 导入数据模态框 -->
    <div v-if="showImportModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>📥 导入数据</h3>
        </div>
        <div class="modal-body">
          <p>请选择要导入的JSON文件（将覆盖当前所有数据）</p>
          <div class="file-input-container">
            <input
              type="file"
              accept=".json"
              @change="handleFileSelect"
              class="file-input"
              id="import-file-input" />
            <label for="import-file-input" class="file-input-label">
              <span v-if="!importFile">📁 选择JSON文件</span>
              <span v-else>📄 {{ importFile.name }}</span>
            </label>
          </div>
          <div v-if="importStatus === 'importing'" class="import-status">
            <div class="loading-spinner"></div>
            <span>正在导入数据...</span>
          </div>
          <div v-if="importStatus === 'success'" class="import-status success">✅ 导入成功！</div>
          <div v-if="importStatus === 'error'" class="import-status error">❌ 导入失败</div>
        </div>
        <div class="modal-actions">
          <button
            @click="importData"
            class="btn btn-primary"
            :disabled="!importFile || importStatus === 'importing'">
            <span v-if="importStatus === 'importing'">⏳ 导入中...</span>
            <span v-else>📥 确认导入</span>
          </button>
          <button @click="cancelImport" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- 新增分类模态框 -->
    <div v-if="showAddCategoryModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>➕ 新增分类</h3>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>分类名称</label>
            <input v-model="newCategoryForm.name" type="text" placeholder="输入分类名称" required />
          </div>
          <div class="form-group">
            <label>分类图标</label>
            <select v-model="newCategoryForm.icon" class="emoji-select" required>
              <option value="">请选择图标</option>
              <option v-for="emoji in emojisData.emojis" :key="emoji.value" :value="emoji.value">
                {{ emoji.value }} {{ emoji.name }} ({{ emoji.category }})
              </option>
            </select>
          </div>
          <div v-if="addCategoryStatus === 'saving'" class="import-status">
            <div class="loading-spinner"></div>
            <span>正在添加分类...</span>
          </div>
          <div v-if="addCategoryStatus === 'success'" class="import-status success">✅ 添加成功！</div>
          <div v-if="addCategoryStatus === 'error'" class="import-status error">❌ 添加失败</div>
        </div>
        <div class="modal-actions">
          <button
            @click="addNewCategory"
            class="btn btn-primary"
            :disabled="!newCategoryForm.name || !newCategoryForm.icon || addCategoryStatus === 'saving'">
            <span v-if="addCategoryStatus === 'saving'">⏳ 添加中...</span>
            <span v-else>➕ 添加分类</span>
          </button>
          <button @click="cancelAddCategory" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- 编辑分类模态框 -->
    <div v-if="showEditCategoryModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>编辑分类</h3>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>分类名称</label>
            <input v-model="editCategoryForm.name" type="text" placeholder="输入分类名称" />
          </div>
          <div class="form-group">
            <label>分类图标</label>
            <select v-model="editCategoryForm.icon" class="emoji-select" required>
              <option value="">请选择图标</option>
              <option v-for="emoji in emojisData.emojis" :key="emoji.value" :value="emoji.value">
                {{ emoji.value }} {{ emoji.name }} ({{ emoji.category }})
              </option>
            </select>
          </div>

          <div v-if="editCategoryStatus === 'saving'" class="import-status">⏳ 正在保存...</div>
          <div v-if="editCategoryStatus === 'success'" class="import-status success">✅ 保存成功！</div>
          <div v-if="editCategoryStatus === 'error'" class="import-status error">❌ 保存失败</div>

          <div class="modal-actions">
            <button
              @click="updateCategory"
              class="btn btn-primary"
              :disabled="!editCategoryForm.name || !editCategoryForm.icon || editCategoryStatus === 'saving'">
              <span v-if="editCategoryStatus === 'saving'">⏳ 保存中...</span>
              <span v-else>💾 保存修改</span>
            </button>
            <button @click="cancelEditCategory" class="btn btn-secondary">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除分类确认模态框 -->
    <div v-if="showDeleteCategoryConfirm" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>🗑️ 确认删除分类</h3>
        </div>
        <div class="modal-body">
          <p>确定要删除这个分类吗？此操作无法撤销！</p>
          <div v-if="deleteCategoryStatus === 'deleting'" class="import-status">
            <div class="loading-spinner"></div>
            <span>正在删除分类...</span>
          </div>
          <div v-if="deleteCategoryStatus === 'success'" class="import-status success">✅ 删除成功！</div>
          <div v-if="deleteCategoryStatus === 'error'" class="import-status error">❌ 删除失败</div>
        </div>
        <div class="modal-actions">
          <button
            @click="deleteCategory"
            class="btn btn-danger"
            :disabled="deleteCategoryStatus === 'deleting'">
            <span v-if="deleteCategoryStatus === 'deleting'">⏳ 删除中...</span>
            <span v-else>🗑️ 确认删除</span>
          </button>
          <button
            @click="cancelDeleteCategory"
            class="btn btn-secondary"
            :disabled="deleteCategoryStatus === 'deleting'">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import localforage from "localforage";
  import draggable from "vuedraggable";
  import websitesData from "@/data/websites.json";
  import axios from "axios";
  import emojisData from "@/data/emojis.json";
  import type { SearchResult } from "@/types/search";

  // 状态管理变量
  const allWebsites = ref<SearchResult[]>([]);
  const categories = ref<typeof websitesData.categories>([]);
  const searchQuery = ref<string>("");
  const selectedCategory = ref<string>("");
  const isLoading = ref<boolean>(true);
  const isEditing = ref<boolean>(false);
  const editingWebsite = ref<SearchResult | null>(null);
  const saveStatus = ref<"idle" | "saving" | "success" | "error">("idle");
  const deleteStatus = ref<"idle" | "deleting" | "success" | "error">("idle");
  const errorMessage = ref<string>("");
  const showResetConfirm = ref<boolean>(false);
  const showImportModal = ref<boolean>(false);
  const importStatus = ref<"idle" | "importing" | "success" | "error">("idle");
  const importFile = ref<File | null>(null);

  // 新增分类相关状态
  const showAddCategoryModal = ref<boolean>(false);
  const addCategoryStatus = ref<"idle" | "saving" | "success" | "error">("idle");

  // 删除分类相关状态
  const showDeleteCategoryConfirm = ref<boolean>(false);
  const deletingCategory = ref<string | null>(null);
  const deleteCategoryStatus = ref<"idle" | "deleting" | "success" | "error">("idle");

  // 编辑分类相关状态
  const showEditCategoryModal = ref<boolean>(false);
  const editingCategory = ref<(typeof websitesData.categories)[number] | null>(null);
  const editCategoryStatus = ref<"idle" | "saving" | "success" | "error">("idle");

  // 拖拽排序相关状态
  const isDragging = ref<boolean>(false);

  interface EditForm {
    name: string;
    url: string;
    icon: string;
    description: string;
    categoryId: string;
  }

  // 新增分类表单
  interface NewCategoryForm {
    name: string;
    icon: string;
  }

  // 编辑表单
  const editForm = ref<EditForm>({
    name: "",
    url: "",
    icon: "",
    description: "",
    categoryId: "",
  });

  // 新增分类表单
  const newCategoryForm = ref<NewCategoryForm>({
    name: "",
    icon: "",
  });

  // 编辑分类表单
  const editCategoryForm = ref<NewCategoryForm>({
    name: "",
    icon: "",
  });

  // 计算属性
  const filteredCategories = computed(() => {
    if (!searchQuery.value) {
      return categories.value;
    }

    const query = searchQuery.value.toLowerCase();
    return categories.value
      .map((category) => ({
        ...category,
        websites: category.websites.filter(
          (website) =>
            website.name.toLowerCase().includes(query) ||
            website.url.toLowerCase().includes(query) ||
            website.description.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.websites.length > 0);
  });

  const filteredWebsites = computed(() => {
    let websites = allWebsites.value;

    // 分类筛选
    if (selectedCategory.value) {
      const category = categories.value.find((c) => c.id === selectedCategory.value);
      if (category) {
        websites = websites.filter((w) => w.category === category.name);
      }
    }

    // 搜索筛选
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      websites = websites.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.url.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query) ||
          w.category.toLowerCase().includes(query)
      );
    }

    return websites;
  });

  // 方法
  const loadWebsites = async () => {
    isLoading.value = true;
    try {
      // 首先尝试从 localforage 读取修改后的数据
      const savedData = await localforage.getItem("websiteCategories");
      if (savedData) {
        // 使用保存的数据
        categories.value = savedData as typeof websitesData.categories;
      } else {
        // 如果没有保存的数据，使用导入的静态数据
        categories.value = websitesData.categories;
      }

      // 更新 allWebsites 用于搜索
      allWebsites.value = [];
      categories.value.forEach((category) => {
        category.websites.forEach((website) => {
          allWebsites.value.push({
            ...website,
            category: category.name,
            categoryIcon: category.icon,
          });
        });
      });
    } catch (error) {
      console.error("加载数据失败:", error);
      // 降级方案：使用导入的静态数据
      categories.value = websitesData.categories;
      allWebsites.value = [];
      categories.value.forEach((category) => {
        category.websites.forEach((website) => {
          allWebsites.value.push({
            ...website,
            category: category.name,
            categoryIcon: category.icon,
          });
        });
      });
    } finally {
      isLoading.value = false;
    }
  };

  const handleAdminSearch = () => {
    // 触发搜索功能
    // 搜索逻辑已经在filteredCategories计算属性中自动处理
    // 这里主要提供用户反馈和确保UI更新

    // 添加搜索反馈动画或状态（可选）
    if (searchQuery.value.trim()) {
      console.log("搜索关键词:", searchQuery.value);
    }

    // 由于Vue的计算属性是响应式的，不需要手动触发更新
    // 搜索功能会自动工作
  };

  interface Website {
    name: string;
    url: string;
    icon: string;
    description: string;
  }

  // 图片加载失败处理
  const handleImageError = async (event: Event, website: Website) => {
    const img = event.target as HTMLImageElement;

    try {
      // 首先检查本地存储中是否有缓存的图标
      const cachedIcon = await localforage.getItem<string>(`icon_${website.url}`);

      if (cachedIcon) {
        img.src = cachedIcon;
        return;
      }

      // 如果没有缓存，尝试获取网站图标
      const iconUrl = await fetchWebsiteIcon(website.url, website.name);
      console.log("iconUrl", iconUrl);
      // 首字母图标的base64数据通常以特定格式开头
      if (!iconUrl.startsWith("data:image/svg+xml;base64,PD94bWwg")) {
        await updateWebsiteIconInData(website.url, iconUrl);
      }

      // 更新图片src
      img.src = iconUrl;
    } catch (error) {
      console.error("处理图标加载失败时出错:", error);
      // 使用网站名称首字母生成的图标作为后备（不保存到本地存储）
      img.src = generateInitialIcon(website.name);
    }
  };

  // 获取网站图标
  const fetchWebsiteIcon = async (url: string, name: string): Promise<string> => {
    try {
      const domain = new URL(url).hostname;
      const iconUrl = `https://${domain}/favicon.ico`;

      // 尝试获取favicon.ico
      const response = await axios.get(iconUrl, { responseType: "blob" });
      if (response.status === 200) {
        const blob = response.data;
        // 转换为base64格式
        return await blobToBase64(blob);
      }
    } catch (error) {
      console.warn("获取favicon.ico失败:", error);

      // 尝试从网站HTML中查找link标签中的图标
      try {
        const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
          // responseType: "text",
          timeout: 5000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        const html = response.data.contents;

        // 使用正则表达式查找包含icon的link标签
        const iconRegex =
          /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
        let match;
        let bestIconUrl = "";

        while ((match = iconRegex.exec(html)) !== null) {
          const href = match[1];
          // 优先选择apple-touch-icon（通常尺寸更大更清晰）
          if (match[0].includes("apple-touch-icon")) {
            bestIconUrl = href;
            break;
          }
          bestIconUrl = href;
        }

        if (bestIconUrl) {
          // 处理相对路径
          const absoluteIconUrl = new URL(bestIconUrl, url).href;
          const iconResponse = await axios.get(absoluteIconUrl, { responseType: "blob" });

          if (iconResponse.status === 200) {
            const blob = iconResponse.data;
            // 转换为base64格式
            return await blobToBase64(blob);
          }
        }
      } catch (linkError) {
        console.warn("从link标签获取图标失败:", linkError);
      }
    }

    // 如果所有方法都失败，使用网站名称首字母生成的图标
    return generateInitialIcon(name);
  };

  // 将Blob转换为Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // 生成基于网站名称首字母的SVG图标
  const generateInitialIcon = (name: string): string => {
    // 获取网站名称的第一个字符，如果没有则使用"?"
    const initial = name.trim().charAt(0).toUpperCase() || "?";

    // 创建SVG内容
    const svgContent = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" fill="#F3F4F6"/>
      <circle cx="24" cy="24" r="16" fill="#4F46E5"/>
      <text x="24" y="30" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial, sans-serif">${initial}</text>
    </svg>`;

    // 转换为base64
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
  };

  // 获取网站元数据（图标和描述）
  const fetchWebsiteMeta = async () => {
    if (!editForm.value.url) return;

    try {
      // 获取网站图标
      const iconUrl = await fetchWebsiteIcon(editForm.value.url, editForm.value.name || "");
      editForm.value.icon = iconUrl;

      // 获取网站元数据
      const metaData = await fetchWebsiteDescription(editForm.value.url);
      editForm.value.description = metaData.description;

      try {
        // 优先使用网页title
        if (metaData.title) {
          editForm.value.name = metaData.title;
          return;
        }

        // 如果没有获取到title，再尝试从URL提取域名
        const urlObj = new URL(editForm.value.url);
        editForm.value.name = urlObj.hostname.replace("www.", "").split(".")[0];
        editForm.value.name = editForm.value.name.charAt(0).toUpperCase() + editForm.value.name.slice(1);
      } catch (error) {
        console.warn("无法提取网站名称:", error);
      }
    } catch (error) {
      console.warn("获取网站元数据失败:", error);
    }
  };

  // 获取网站元数据（标题和描述）
  const fetchWebsiteDescription = async (url: string): Promise<{ title: string; description: string }> => {
    try {
      const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
        // responseType: "text",
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      const html = response.data.contents;
      let title = "";
      let description = "";

      // 查找网页标题
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }

      // 查找meta description
      const descriptionMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim();
      }

      // 查找og:description
      const ogDescriptionMatch = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      if (ogDescriptionMatch && ogDescriptionMatch[1] && !description) {
        description = ogDescriptionMatch[1].trim();
      }

      // 查找twitter:description
      const twitterDescriptionMatch = html.match(
        /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      );
      if (twitterDescriptionMatch && twitterDescriptionMatch[1] && !description) {
        description = twitterDescriptionMatch[1].trim();
      }

      // 如果没有描述，使用h1作为备选
      const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
      if (h1Match && h1Match[1] && !description) {
        description = h1Match[1].trim();
      }

      return { title, description };
    } catch (error) {
      console.warn("获取网站元数据失败:", error);
      return { title: "", description: "" };
    }
  };

  const showAllWebsites = () => {
    searchQuery.value = "";
    selectedCategory.value = "";
  };

  const toggleCategoryFilter = (categoryId: string) => {
    selectedCategory.value = selectedCategory.value === categoryId ? "" : categoryId;
  };

  // 分类拖拽排序
  const onCategoryDragEnd = () => {
    isDragging.value = false;
    saveCategoriesOrder();
  };

  // 网站拖拽排序
  const onWebsiteDragEnd = (categoryId: string) => {
    isDragging.value = false;
    saveWebsitesOrder(categoryId);
  };

  // 保存分类排序
  const saveCategoriesOrder = async () => {
    try {
      // 深度克隆以避免循环引用
      const dataToSave = JSON.parse(JSON.stringify(categories.value));
      await localforage.setItem("websiteCategories", dataToSave);
      console.log("分类排序已保存");

      // 重新加载数据以确保UI更新
      loadWebsites();
    } catch (error) {
      console.error("保存分类排序失败:", error);
    }
  };

  // 保存网站排序
  const saveWebsitesOrder = async (categoryId: string) => {
    try {
      // 深度克隆以避免循环引用
      const dataToSave = JSON.parse(JSON.stringify(categories.value));
      await localforage.setItem("websiteCategories", dataToSave);
      console.log(`分类 ${categoryId} 的网站排序已保存`, dataToSave);

      // 重新加载数据以确保UI更新
      loadWebsites();
    } catch (error) {
      console.error("保存网站排序失败:", error);
    }
  };

  const addNewWebsite = () => {
    editingWebsite.value = null;
    editForm.value = {
      name: "",
      url: "",
      icon: "",
      description: "",
      categoryId: "",
    };
    isEditing.value = true;
  };

  const editWebsite = (website: SearchResult) => {
    editingWebsite.value = website;
    const category = categories.value.find((c) => c.name === website.category);

    editForm.value = {
      name: website.name,
      url: website.url,
      icon: website.icon || "",
      description: website.description,
      categoryId: category?.id || "",
    };
    isEditing.value = true;
  };

  const cancelEdit = () => {
    isEditing.value = false;
    editingWebsite.value = null;
    saveStatus.value = "idle";
    deleteStatus.value = "idle";
  };

  // 重置数据到初始状态
  const resetToDefault = async () => {
    await localforage.removeItem("websiteCategories");
    loadWebsites();
    showResetConfirm.value = false;
  };

  // 更新网站图标到websiteCategories数据中
  const updateWebsiteIconInData = async (websiteUrl: string, iconUrl: string) => {
    try {
      // 查找包含该网站的分类
      for (const category of categories.value) {
        const website = category.websites.find((w) => w.url === websiteUrl);
        if (website) {
          // 更新图标
          website.icon = iconUrl;

          // 保存到 localforage - 需要深度克隆以避免循环引用
          const dataToSave = JSON.parse(JSON.stringify(categories.value));
          await localforage.setItem("websiteCategories", dataToSave);

          console.log(`网站 ${websiteUrl} 的图标已更新到数据中`);
          break;
        }
      }
    } catch (error) {
      console.error("更新网站图标到数据失败:", error);
    }
  };

  // 将图片URL转换为base64
  const convertImageToBase64 = async (url: string, websiteUrl?: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Icon = reader.result as string;

          // 如果提供了websiteUrl，将图标更新到数据中
          if (websiteUrl && !base64Icon.startsWith("data:image/svg+xml;base64,PD94bWwg")) {
            await updateWebsiteIconInData(websiteUrl, base64Icon);
          }

          resolve(base64Icon);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("图片转换base64失败:", error);
      // 如果转换失败，返回原始URL
      return url;
    }
  };

  const saveWebsite = async () => {
    try {
      // 表单验证 - 检查必填字段
      if (!editForm.value.name?.trim()) {
        saveStatus.value = "error";
        errorMessage.value = "网站名称不能为空";
        setTimeout(() => {
          saveStatus.value = "idle";
          errorMessage.value = "";
        }, 2000);
        throw new Error("网站名称不能为空");
      }

      if (!editForm.value.url?.trim()) {
        saveStatus.value = "error";
        errorMessage.value = "网站URL不能为空";
        setTimeout(() => {
          saveStatus.value = "idle";
          errorMessage.value = "";
        }, 2000);
        throw new Error("网站URL不能为空");
      }

      if (!editForm.value.categoryId) {
        saveStatus.value = "error";
        errorMessage.value = "请选择网站分类";
        setTimeout(() => {
          saveStatus.value = "idle";
          errorMessage.value = "";
        }, 2000);
        throw new Error("请选择网站分类");
      }

      // URL格式验证
      try {
        new URL(editForm.value.url);
      } catch {
        saveStatus.value = "error";
        errorMessage.value = "请输入有效的URL地址";
        setTimeout(() => {
          saveStatus.value = "idle";
          errorMessage.value = "";
        }, 2000);
        throw new Error("请输入有效的URL地址");
      }

      saveStatus.value = "saving";

      // 模拟保存操作（实际项目中这里应该调用API）
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 转换图标为base64（如果是URL且不是data URI）
      let finalIcon = editForm.value.icon;
      if (
        editForm.value.icon &&
        editForm.value.icon.startsWith("http") &&
        !editForm.value.icon.startsWith("data:")
      ) {
        finalIcon = await convertImageToBase64(editForm.value.icon, editForm.value.url);
      }

      // 实际更新本地数据
      if (editingWebsite.value) {
        // 编辑现有网站
        const category = categories.value.find((c) => c.id === editForm.value.categoryId);
        if (category) {
          const websiteIndex = category.websites.findIndex((w) => w.name === editingWebsite.value?.name);
          if (websiteIndex !== -1) {
            // 更新现有网站
            category.websites[websiteIndex] = {
              name: editForm.value.name,
              url: editForm.value.url,
              icon: finalIcon,
              description: editForm.value.description,
            };
          }
        }
      } else {
        // 添加新网站
        const category = categories.value.find((c) => c.id === editForm.value.categoryId);
        if (category) {
          category.websites.push({
            name: editForm.value.name,
            url: editForm.value.url,
            icon: finalIcon,
            description: editForm.value.description,
          });
        }
      }

      // 保存到 localforage - 需要深度克隆以避免循环引用
      const dataToSave = JSON.parse(JSON.stringify(categories.value));
      await localforage.setItem("websiteCategories", dataToSave);

      // 更新本地状态
      saveStatus.value = "success";

      // 重新加载数据
      loadWebsites();

      // 延迟关闭编辑界面
      setTimeout(() => {
        isEditing.value = false;
        editingWebsite.value = null;
        saveStatus.value = "idle";
      }, 1000);
    } catch (error) {
      console.error("保存网站失败:", error);
      saveStatus.value = "error";

      // 3秒后重置状态
      setTimeout(() => {
        saveStatus.value = "idle";
      }, 3000);
    }
  };

  const deleteWebsite = async () => {
    if (!editingWebsite.value) return;

    try {
      deleteStatus.value = "deleting";

      // 模拟删除操作的延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 实际删除本地数据
      const category = categories.value.find((c) => c.name === editingWebsite.value?.category);
      if (category) {
        // 删除网站
        category.websites = category.websites.filter((site) => site.name !== editingWebsite.value?.name);

        // 保存到 localforage - 需要深度克隆以避免循环引用
        const dataToSave = JSON.parse(JSON.stringify(categories.value));
        await localforage.setItem("websiteCategories", dataToSave);

        // 同时更新allWebsites用于搜索
        loadWebsites();
      }

      deleteStatus.value = "success";

      // 2秒后关闭编辑
      setTimeout(() => {
        isEditing.value = false;
        editingWebsite.value = null;
        deleteStatus.value = "idle";
      }, 2000);
    } catch (error) {
      console.error("删除失败:", error);
      deleteStatus.value = "error";

      // 5秒后重置错误状态
      setTimeout(() => {
        deleteStatus.value = "idle";
      }, 5000);
    }
  };

  // 生命周期
  onMounted(() => {
    loadWebsites();

    // 测试 localforage 是否正常工作
    testLocalForage();
  });

  // 测试 localforage 功能
  const testLocalForage = async () => {
    try {
      console.log("测试 localforage 功能...");

      // 测试写入
      await localforage.setItem("test_key", "test_value");
      console.log("测试数据写入成功");

      // 测试读取
      const testValue = await localforage.getItem("test_key");
      console.log("测试数据读取结果:", testValue);

      // 检查是否有保存的数据
      const savedData = await localforage.getItem("websiteCategories");
      console.log("已保存的数据:", savedData);
    } catch (error) {
      console.error("localforage 测试失败:", error);
    }
  };

  // 导出数据为JSON文件
  const exportData = async () => {
    try {
      // 获取当前数据
      const currentData = await localforage.getItem("websiteCategories");
      const dataToExport = currentData || websitesData.categories;

      // 创建JSON字符串
      const jsonString = JSON.stringify(dataToExport, null, 2);

      // 创建Blob对象
      const blob = new Blob([jsonString], { type: "application/json" });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // link.download = "website-data-" + new Date().toISOString().split("T")[0] + ".json";
      link.download = "websites.json";

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("数据导出成功");
    } catch (error) {
      console.error("导出数据失败:", error);
      alert("导出数据失败，请重试");
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      importFile.value = target.files[0];
    }
  };

  // 导入数据
  const importData = async () => {
    if (!importFile.value) return;

    try {
      importStatus.value = "importing";

      // 读取文件内容
      const fileContent = await readFileAsText(importFile.value);

      // 解析JSON
      const importedData = JSON.parse(fileContent);

      // 验证数据格式
      if (
        !Array.isArray(importedData) ||
        !importedData.every((item) => item.id && item.name && Array.isArray(item.websites))
      ) {
        throw new Error("无效的数据格式");
      }

      // 保存到localforage
      await localforage.setItem("websiteCategories", importedData);

      // 更新本地状态
      importStatus.value = "success";

      // 重新加载数据
      loadWebsites();

      // 2秒后重置状态
      setTimeout(() => {
        showImportModal.value = false;
        importStatus.value = "idle";
        importFile.value = null;
      }, 2000);
    } catch (error) {
      console.error("导入数据失败:", error);
      importStatus.value = "error";

      // 5秒后重置错误状态
      setTimeout(() => {
        importStatus.value = "idle";
      }, 5000);
    }
  };

  // 取消导入
  const cancelImport = () => {
    showImportModal.value = false;
    importStatus.value = "idle";
    importFile.value = null;
  };

  // 读取文件为文本
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  // 新增分类相关方法
  const openAddCategoryModal = () => {
    showAddCategoryModal.value = true;
    newCategoryForm.value = {
      name: "",
      icon: "",
    };
    addCategoryStatus.value = "idle";
  };

  const addNewCategory = async () => {
    if (!newCategoryForm.value.name || !newCategoryForm.value.icon) return;

    try {
      addCategoryStatus.value = "saving";

      // 模拟保存操作
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 生成新的分类ID
      const newId = `category-${Date.now()}`;

      // 创建新分类
      const newCategory = {
        id: newId,
        name: newCategoryForm.value.name,
        icon: newCategoryForm.value.icon,
        websites: [],
      };

      // 添加到分类列表
      categories.value.push(newCategory);

      // 保存到 localforage
      const dataToSave = JSON.parse(JSON.stringify(categories.value));
      await localforage.setItem("websiteCategories", dataToSave);

      // 更新状态
      addCategoryStatus.value = "success";

      // 重新加载数据
      loadWebsites();

      // 2秒后关闭模态框
      setTimeout(() => {
        showAddCategoryModal.value = false;
        addCategoryStatus.value = "idle";
        newCategoryForm.value = {
          name: "",
          icon: "",
        };
      }, 2000);
    } catch (error) {
      console.error("添加分类失败:", error);
      addCategoryStatus.value = "error";

      // 5秒后重置错误状态
      setTimeout(() => {
        addCategoryStatus.value = "idle";
      }, 5000);
    }
  };

  const cancelAddCategory = () => {
    showAddCategoryModal.value = false;
    addCategoryStatus.value = "idle";
    newCategoryForm.value = {
      name: "",
      icon: "",
    };
  };

  const editCategory = (category: (typeof websitesData.categories)[number]) => {
    editingCategory.value = category;
    editCategoryForm.value = {
      name: category.name,
      icon: category.icon,
    };
    showEditCategoryModal.value = true;
    editCategoryStatus.value = "idle";
  };

  const updateCategory = async () => {
    if (!editingCategory.value || !editCategoryForm.value.name || !editCategoryForm.value.icon) return;

    try {
      editCategoryStatus.value = "saving";

      // 模拟保存操作
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 更新分类信息
      const categoryIndex = categories.value.findIndex((c) => c.id === editingCategory.value?.id);
      if (categoryIndex !== -1) {
        categories.value[categoryIndex] = {
          ...categories.value[categoryIndex],
          name: editCategoryForm.value.name,
          icon: editCategoryForm.value.icon,
        };

        // 保存到 localforage
        const dataToSave = JSON.parse(JSON.stringify(categories.value));
        await localforage.setItem("websiteCategories", dataToSave);

        // 更新状态
        editCategoryStatus.value = "success";

        // 重新加载数据
        loadWebsites();

        // 2秒后关闭模态框
        setTimeout(() => {
          showEditCategoryModal.value = false;
          editCategoryStatus.value = "idle";
          editingCategory.value = null;
          editCategoryForm.value = {
            name: "",
            icon: "",
          };
        }, 2000);
      }
    } catch (error) {
      console.error("更新分类失败:", error);
      editCategoryStatus.value = "error";

      // 5秒后重置错误状态
      setTimeout(() => {
        editCategoryStatus.value = "idle";
      }, 5000);
    }
  };

  const cancelEditCategory = () => {
    showEditCategoryModal.value = false;
    editCategoryStatus.value = "idle";
    editingCategory.value = null;
    editCategoryForm.value = {
      name: "",
      icon: "",
    };
  };

  // 删除分类相关方法
  const confirmDeleteCategory = (categoryId: string) => {
    const category = categories.value.find((c) => c.id === categoryId);
    if (category && category.websites.length > 0) {
      alert(
        `无法删除分类"${category.name}"，该分类下还有 ${category.websites.length} 个网站。请先移动或删除这些网站。`
      );
      return;
    }

    deletingCategory.value = categoryId;
    showDeleteCategoryConfirm.value = true;
  };

  const cancelDeleteCategory = () => {
    showDeleteCategoryConfirm.value = false;
    deletingCategory.value = null;
    deleteCategoryStatus.value = "idle";
  };

  const deleteCategory = async () => {
    if (!deletingCategory.value) return;

    try {
      deleteCategoryStatus.value = "deleting";

      // 从分类列表中移除
      categories.value = categories.value.filter((c) => c.id !== deletingCategory.value);

      // 保存到 localforage
      const dataToSave = JSON.parse(JSON.stringify(categories.value));
      await localforage.setItem("websiteCategories", dataToSave);

      // 更新状态
      deleteCategoryStatus.value = "success";

      // 重新加载数据
      loadWebsites();

      // 2秒后关闭确认对话框
      setTimeout(() => {
        showDeleteCategoryConfirm.value = false;
        deletingCategory.value = null;
        deleteCategoryStatus.value = "idle";
      }, 2000);
    } catch (error) {
      console.error("删除分类失败:", error);
      deleteCategoryStatus.value = "error";

      // 5秒后重置错误状态
      setTimeout(() => {
        deleteCategoryStatus.value = "idle";
      }, 5000);
    }
  };
</script>

<style scoped>
  .admin-container {
    min-height: 100vh;
    background: #f8fafc;
  }

  .admin-header {
    background: white;
    padding: 2rem;
    box-sizing: border-box;
    /* border-bottom: 1px solid #e5e7eb; */
    /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */
  }

  .admin-content {
    display: flex;
    min-height: calc(100vh - 80px);
  }

  .admin-sidebar {
    width: 330px;
    height: 100vh;
    background: white;
    border-right: 1px solid #e5e7eb;
    padding: 1.5rem;
    box-sizing: border-box;
    overflow-y: auto;
    position: fixed;
    z-index: 999;
  }

  .admin-nav h3 {
    margin-bottom: 1.5rem;
    color: #374151;
    font-weight: 600;
  }

  .admin-nav ul {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem 0;
  }

  .admin-nav li {
    margin-bottom: 0.5rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: #374151;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    background: #f3f4f6;
    color: #4f46e5;
  }

  .nav-icon {
    margin-right: 0.75rem;
    font-size: 1.1rem;
  }

  .category-filter {
    margin-top: 2rem;
  }

  .category-filter h4 {
    margin-bottom: 1rem;
    color: #374151;
    font-weight: 500;
  }

  .category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .category-tag {
    padding: 0.5rem 0.75rem;
    /* background: #f9fafb;
  border: 1px solid #e5e7eb; */
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  /* .category-tag:hover {
  background: #f3f4f6;
} */

  .category-tag.active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: white;
  }

  .category-tag-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 0.25rem 0.5rem 0.25rem 0.75rem;
    transition: all 0.2s ease;
  }

  .category-tag-wrapper:hover {
    background: #f3f4f6;
  }

  .category-tag-wrapper.active {
    background: #4f46e5;
    border-color: #4f46e5;
  }

  .category-tag-wrapper.active .category-tag {
    color: white;
  }

  .category-edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    font-size: 0.75rem;
    transition: all 0.2s ease;
    opacity: 0.6;
    margin-right: 0.25rem;
  }

  .category-edit-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    opacity: 1;
    transform: scale(1.1);
  }

  .category-tag-wrapper.active .category-edit-btn {
    color: white;
    opacity: 0.8;
  }

  .category-tag-wrapper.active .category-edit-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    opacity: 1;
  }

  .category-delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    font-size: 0.75rem;
    transition: all 0.2s ease;
    opacity: 0.6;
  }

  .category-delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    opacity: 1;
    transform: scale(1.1);
  }

  .category-tag-wrapper.active .category-delete-btn {
    color: white;
    opacity: 0.8;
  }

  .category-tag-wrapper.active .category-delete-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    opacity: 1;
  }

  .admin-main {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    margin-left: 330px;
  }

  .admin-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .admin-toolbar h2 {
    color: #1f2937;
    margin: 0;
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #4f46e5;
    color: white;
  }

  .btn-primary:hover {
    background: #4338ca;
  }

  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .edit-form {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .website-list {
    background: white;
    /* border-radius: 12px; */
    padding: 2rem;
    box-sizing: border-box;
    /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .total-count {
    color: #6b7280;
    font-weight: 500;
  }

  .search-status {
    color: #4f46e5;
    font-weight: 500;
  }

  .websites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .website-item {
    display: flex;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .website-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #4f46e5;
  }

  .website-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
    overflow: hidden;
  }

  .website-icon img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .icon-fallback {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4f46e5;
  }

  .website-info {
    flex: 1;
    min-width: 0;
  }

  .website-info h4 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-weight: 600;
  }

  .website-url {
    margin: 0 0 0.5rem 0;
    color: #4f46e5;
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .website-desc {
    margin: 0 0 0.75rem 0;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .website-meta {
    display: flex;
    align-items: center;
  }

  .category {
    color: #6b7280;
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* 分类标题样式 */
  .category-section {
    margin-bottom: 2.5rem;
  }

  .category-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .category-title {
    display: flex;
    align-items: center;
    margin: 0;
    color: #1f2937;
    font-weight: 600;
    font-size: 1.25rem;
  }

  .title-icon {
    margin-right: 0.75rem;
    font-size: 1.5rem;
  }

  .category-count {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .website-actions {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .btn-edit {
    padding: 0.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .btn-edit:hover {
    background: #f3f4f6;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
  }

  .empty-state h3 {
    margin: 0 0 1rem 0;
    color: #374151;
    font-weight: 600;
  }

  .empty-state p {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
  }

  .select {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .select > .btn {
    width: 130px;
  }

  @media (max-width: 1024px) {
    .admin-content {
      flex-direction: column;
    }

    .admin-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }

    .websites-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .admin-header {
      padding: 1rem;
    }

    .admin-main {
      padding: 1rem;
    }

    .edit-form,
    .website-list {
      padding: 1.5rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
      margin-bottom: 0.5rem;
    }

    /* 移动端搜索框样式 */
    .search-container {
      max-width: 100%;
      margin: 0 auto 1rem;
    }

    .search-input {
      padding: 1rem 1.25rem;
      font-size: 1rem;
    }

    .search-button {
      padding: 0.875rem 1.25rem;
    }
  }

  /* 搜索框样式 */
  .search-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .search-box {
    position: relative;
    display: flex;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 50px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .search-input {
    flex: 1;
    padding: 1.25rem 1.5rem;
    border: none;
    outline: none;
    font-size: 1.1rem;
    background: transparent;
  }

  .search-button {
    padding: 1rem 1.5rem;
    border: none;
    background: #4f46e5;
    color: white;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .search-button:hover {
    background: #4338ca;
  }

  /* 错误消息样式 */
  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 1rem;
    text-align: center;
    padding: 0.5rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
  }

  /* 悬浮错误提示样式 */
  .floating-error {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    min-width: 300px;
    max-width: 80%;
    padding: 1rem 1.5rem;
    font-size: 1rem;
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    animation: slideInDown 0.3s ease-out;
  }

  @keyframes slideInDown {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  /* 加载状态样式 */
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* 模态框样式 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    margin-bottom: 1.5rem;
  }

  .modal-header h3 {
    margin: 0;
    color: #dc2626;
    font-size: 1.25rem;
  }

  .modal-body {
    margin-bottom: 2rem;
  }

  .modal-body p {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
  }

  .btn-warning:hover {
    background: #d97706;
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }

  /* Emoji选择器样式 */
  .emoji-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    transition: border-color 0.2s ease;
    cursor: pointer;
  }

  .emoji-select:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .emoji-select option {
    font-size: 1rem;
    padding: 0.5rem;
  }

  /* 新增分类模态框特定样式 */
  .add-category-modal .modal {
    max-width: 450px;
  }

  .add-category-modal .modal-header h3 {
    color: #059669;
  }

  .add-category-modal .btn-primary {
    background: #059669;
  }

  .add-category-modal .btn-primary:hover {
    background: #047857;
  }

  /* 拖拽排序样式 */
  .sortable-ghost {
    opacity: 0.5;
    background: #f3f4f6;
  }

  .sortable-chosen {
    background: #e5e7eb;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .sortable-drag {
    opacity: 0.9;
    transform: rotate(5deg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  /* 拖拽手柄样式 */
  .drag-handle {
    cursor: move;
    opacity: 0.6;
    transition: opacity 0.2s ease;
    margin-right: 0.5rem;
  }

  .drag-handle:hover {
    opacity: 1;
  }

  /* 分类拖拽样式 */
  .category-tags .sortable-ghost .category-tag-wrapper {
    opacity: 0.3;
  }

  .category-tags .sortable-chosen .category-tag-wrapper {
    background: #e5e7eb;
    border-radius: 8px;
  }

  /* 网站拖拽样式 */
  .websites-grid .sortable-ghost .website-item {
    opacity: 0.3;
  }

  .websites-grid .sortable-chosen .website-item {
    background: #e5e7eb;
    border-radius: 12px;
  }
</style>
