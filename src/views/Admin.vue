<template>
  <div class="admin-container">
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
              <a href="#" class="nav-link" @click.prevent="showByCategory">
                <span class="nav-icon">📂</span>
                按分类查看
              </a>
            </li>
          </ul>

          <!-- 分类筛选 -->
          <div class="category-filter" v-if="filteredCategories.length > 0">
            <h4>分类筛选</h4>
            <div class="category-tags">
              <span
                v-for="category in filteredCategories"
                :key="category.id"
                :class="['category-tag', { active: selectedCategory === category.id }]"
                @click="toggleCategoryFilter(category.id)">
                {{ category.icon }} {{ category.name }}
              </span>
            </div>
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
            <button v-if="!isEditing" @click="addNewWebsite" class="btn btn-primary">➕ 添加网站</button>
            <button v-if="!isEditing" @click="showResetConfirm = true" class="btn btn-warning">
              🔄 重置数据
            </button>
            <button v-if="isEditing" @click="cancelEdit" class="btn btn-secondary">↩️ 取消</button>
          </div>
        </div>

        <!-- 编辑表单 -->
        <div class="edit-form" v-if="isEditing">
          <form @submit.prevent="saveWebsite">
            <div class="form-group">
              <label>网站名称</label>
              <input v-model="editForm.name" type="text" placeholder="输入网站名称" required />
            </div>
            <div class="form-group">
              <label>网站URL</label>
              <input v-model="editForm.url" type="url" placeholder="https://example.com" required />
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
              <label>所属分类</label>
              <select v-model="editForm.categoryId" required>
                <option value="">选择分类</option>
                <option v-for="category in websitesData.categories" :key="category.id" :value="category.id">
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
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
              <div v-if="saveStatus === 'error'" class="error-message">❌ 保存失败，请重试</div>
              <div v-if="deleteStatus === 'error'" class="error-message">❌ 删除失败，请重试</div>
            </div>
          </form>
        </div>

        <!-- 网站列表 -->
        <div class="website-list" v-else>
          <div class="list-header">
            <span class="total-count"> 共 {{ filteredWebsites.length }} 个网站 </span>
            <div class="search-status" v-if="searchQuery">搜索: "{{ searchQuery }}"</div>
          </div>

          <div class="websites-grid">
            <div
              v-for="website in filteredWebsites"
              :key="website.name + website.url"
              class="website-item editable"
              @click="editWebsite(website)">
              <div class="website-icon">
                <img
                  :src="website.icon"
                  :alt="website.name"
                  @error="
                    (e) => {
                      const target = e.target as HTMLImageElement;
                      if (target) {
                        target.style.display = 'none';
                      }
                    }
                  " />
                <span v-if="!website.icon" class="icon-fallback">
                  {{ website.name.charAt(0) }}
                </span>
              </div>
              <div class="website-info">
                <h4>{{ website.name }}</h4>
                <p class="website-url">{{ website.url }}</p>
                <p class="website-desc">{{ website.description }}</p>
                <div class="website-meta">
                  <span class="category">
                    {{ getCategoryIcon(website.category) }} {{ website.category }}
                  </span>
                </div>
              </div>
              <div class="website-actions">
                <button @click.stop="editWebsite(website)" class="btn-edit">✏️</button>
              </div>
            </div>
          </div>

          <div class="empty-state" v-if="filteredWebsites.length === 0">
            <div class="empty-icon">📭</div>
            <h3>暂无网站数据</h3>
            <p>点击"添加网站"按钮开始添加第一个网站</p>
            <button @click="addNewWebsite" class="btn btn-primary">➕ 添加网站</button>
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
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import localforage from "localforage";
  import websitesData from "@/data/websites.json";
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
  const showResetConfirm = ref<boolean>(false);

  interface EditForm {
    name: string;
    url: string;
    icon: string;
    description: string;
    categoryId: string;
  }

  // 编辑表单
  const editForm = ref<EditForm>({
    name: "",
    url: "",
    icon: "",
    description: "",
    categoryId: "",
  });

  // 计算属性
  const filteredCategories = computed(() => {
    return websitesData.categories;
  });

  const filteredWebsites = computed(() => {
    let websites = allWebsites.value;

    // 分类筛选
    if (selectedCategory.value) {
      const category = websitesData.categories.find((c) => c.id === selectedCategory.value);
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

  const getCategoryIcon = (categoryName: string) => {
    const category = websitesData.categories.find((c) => c.name === categoryName);
    return category ? category.icon : "📁";
  };

  const handleAdminSearch = () => {
    // 直接使用searchQuery.value进行搜索，不需要参数
    // 搜索逻辑已经在filteredWebsites计算属性中处理
  };

  const showAllWebsites = () => {
    searchQuery.value = "";
    selectedCategory.value = "";
  };

  const toggleCategoryFilter = (categoryId: string) => {
    selectedCategory.value = selectedCategory.value === categoryId ? "" : categoryId;
  };

  const showByCategory = () => {
    // 可以扩展为显示分类选择模态框
    selectedCategory.value = "";
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
    const category = websitesData.categories.find((c) => c.name === website.category);

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

  // 将图片URL转换为base64
  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
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
        finalIcon = await convertImageToBase64(editForm.value.icon);
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
  });
</script>

<style scoped>
  .admin-container {
    min-height: 100vh;
    background: #f8fafc;
  }

  .admin-header {
    background: white;
    padding: 1rem 2rem;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .admin-content {
    display: flex;
    min-height: calc(100vh - 80px);
  }

  .admin-sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid #e5e7eb;
    padding: 1.5rem;
    overflow-y: auto;
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
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .category-tag:hover {
    background: #f3f4f6;
  }

  .category-tag.active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: white;
  }

  .admin-main {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
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
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
</style>
