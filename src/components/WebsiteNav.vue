<template>
  <div class="website-nav">
    <!-- 左侧锚点导航 -->
    <div class="nav-sidebar" :class="{ 'show-nav': showLeftNav }">
      <div class="sidebar-header">
        <h3>网站分类</h3>
      </div>
      <nav class="category-nav">
        <a
          v-for="category in categories"
          :key="category.id"
          :href="`#${category.id}`"
          class="nav-item"
          :class="{ active: activeCategory === category.id }"
          @click="setActiveCategory(category.id)">
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
        </a>
      </nav>
    </div>

    <!-- 右侧网站内容 -->
    <div class="nav-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载网站数据...</p>
      </div>

      <!-- 数据内容 -->
      <div v-for="category in categories" :key="category.id" :id="category.id" class="category-section">
        <div class="category-header">
          <h2 class="category-title">
            <span class="title-icon">{{ category.icon }}</span>
            {{ category.name }}
          </h2>
          <div class="category-description">精选{{ category.name }}相关网站资源</div>
        </div>

        <div class="websites-grid">
          <a
            v-for="(website, index) in category.websites"
            :key="index"
            :href="website.url"
            target="_blank"
            rel="noopener noreferrer"
            class="website-card">
            <div class="website-header">
              <img
                :src="website.icon"
                :alt="website.name"
                class="website-icon"
                @error="(event) => handleImageError(event, website)" />
              <h3 class="website-name">{{ website.name }}</h3>
            </div>
            <p class="website-description">{{ website.description }}</p>
            <div class="website-url">{{ getDomain(website.url) }}</div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from "vue";
  import localforage from "localforage";
  import axios from "axios";
  import websitesData from "@/data/websites.json";

  interface Website {
    name: string;
    url: string;
    icon: string;
    description: string;
  }

  interface Category {
    id: string;
    name: string;
    icon: string;
    websites: Website[];
  }

  const categories = ref<Category[]>([]);
  const activeCategory = ref<string>("");
  const showLeftNav = ref<boolean>(false);
  const isLoading = ref<boolean>(true);

  // 获取域名
  const getDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  // 将Blob转换为Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // 获取网站图标
  const fetchWebsiteIcon = async (url: string): Promise<string> => {
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
      console.warn("获取网站图标失败:", error);
    }

    // 如果获取失败，返回默认图标
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCA0QzI5LjUyMjggNCAzNCA4LjQ3NzE1IDM0IDE0QzM0IDE5LjUyMjggMjkuNTIyOCAyNCAyNCAyNEMxOC40NzcyIDI0IDE0IDE5LjUyMjggMTQgMTRDMTQgOC40NzcxNSAxOC40NzcyIDQgMjQgNFoiIGZpbGw9IiRDNkM4Q0EiLz4KPHBhdGggZD0iTTMwIDM0VjQ0SDE4VjM0QzE4IDM1Ljc5MDkgMTkuNzkwOSAzNCAyMiAzNEgyNkMyOC4yMDkxIDM0IDMwIDM1Ljc5MDkgMzAgMzRaIiBmaWxsPSIkQzZDOENBIi8+Cjwvc3ZnPg==";
  };

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
      const iconUrl = await fetchWebsiteIcon(website.url);

      // 保存到本地存储
      await localforage.setItem(`icon_${website.url}`, iconUrl);

      // 更新图片src
      img.src = iconUrl;
    } catch (error) {
      console.error("处理图标加载失败时出错:", error);
      // 使用默认图标作为后备
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA4OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCA0QzI5LjUyMjggNCAzNCA4LjQ3NzE1IDM0IDE0QzM0IDE5LjUyMjggMjkuNTIyOCAyNCAyNCAyNEMxOC40NzcyIDI0IDE0IDE5LjUyMjggMTQgMTRDMTQgOC40NzcxNSAxOC40NzcyIDQgMjQgNFoiIGZpbGw9IiRDNkM4Q0EiLz4KPHBhdGggZD0iTTMwIDM0VjQ0SDE4VjM0QzE4IDM1Ljc5MDkgMTkuNzkwOSAzNCAyMiAzNEgyNkMyOC4yMDkxIDM0IDMwIDM1Ljc5MDkgMzAgMzRaIiBmaWxsPSIkQzZDOENBIi8+Cjwvc3ZnPg==";
    }
  };

  // 设置激活的分类
  const setActiveCategory = (categoryId: string) => {
    activeCategory.value = categoryId;
  };

  // 监听滚动，更新激活状态和控制导航显示
  const handleScroll = () => {
    const sections = document.querySelectorAll(".category-section");
    const scrollPosition = window.scrollY + 100;

    // 控制左侧导航显示：当滚动到第一个分类区域时显示
    const firstSection = sections[0] as HTMLElement;
    if (firstSection && scrollPosition >= firstSection.offsetTop - 200) {
      showLeftNav.value = true;
    } else {
      showLeftNav.value = false;
    }

    sections.forEach((section) => {
      const element = section as HTMLElement;
      const offsetTop = element.offsetTop;
      const height = element.offsetHeight;

      if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
        activeCategory.value = element.id;
      }
    });
  };

  // 加载网站数据
  const loadWebsiteData = async () => {
    try {
      // 首先尝试从localforage加载
      const storedData = await localforage.getItem<Category[]>("websiteCategories");

      if (storedData && storedData.length > 0) {
        categories.value = storedData;
        console.log("从本地存储加载网站数据");
      } else {
        // 如果没有本地数据，使用JSON数据并保存到localforage
        categories.value = websitesData.categories;
        await localforage.setItem("websiteCategories", websitesData.categories);
        console.log("从JSON文件加载并保存到本地存储");
      }

      // 初始化激活第一个分类
      if (categories.value.length > 0) {
        activeCategory.value = categories.value[0].id;
      }
    } catch (error) {
      console.error("加载网站数据失败:", error);
      // 出错时使用默认数据
      categories.value = websitesData.categories;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  loadWebsiteData();
  
  // 页面加载完成后立即调用一次，确保初始状态正确
  setTimeout(() => {
    handleScroll();
  }, 100);
});

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
</script>

<style scoped>
  .website-nav {
    display: flex;
    min-height: 100vh;
    background: #f8fafc;
  }

  /* 左侧导航栏 */
  .nav-sidebar {
    width: 250px;
    background: white;
    border-right: 1px solid #e5e7eb;
    padding: 1.5rem 0;
    position: fixed;
    top: 0;
    left: -300px;
    height: 100vh;
    overflow-y: auto;
    transition: left 0.3s ease;
    z-index: 1000;
  }

  .nav-sidebar.show-nav {
    left: 0;
  }

  .sidebar-header {
    padding: 0 1.5rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 1rem;
  }

  .sidebar-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }

  .category-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0 0.75rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    color: #6b7280;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .nav-item:hover {
    background: #f9fafb;
    color: #374151;
  }

  .nav-item.active {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
  }

  .category-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }

  .category-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  /* 右侧内容区域 */
  .nav-content {
    flex: 1;
    margin-left: 0;
    padding: 2rem;
    transition: margin-left 0.3s ease;
  }

  .show-nav ~ .nav-content {
    margin-left: 250px;
  }

  .category-section {
    margin-bottom: 3rem;
    scroll-margin-top: 2rem;
  }

  .category-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .category-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .title-icon {
    font-size: 2.5rem;
  }

  .category-description {
    font-size: 1.125rem;
    color: #6b7280;
  }

  .websites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .website-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .website-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border-color: #4f46e5;
  }

  .website-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.75rem;
  }

  .website-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    object-fit: cover;
    flex-shrink: 0;
  }

  .website-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .website-description {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .website-url {
    font-size: 0.75rem;
    color: #9ca3af;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  }

  /* 加载状态 */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }

  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-state p {
    color: #6b7280;
    font-size: 1.125rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  /* 响应式设计 */
  @media (max-width: 1024px) {
    .nav-sidebar {
      width: 200px;
    }

    .nav-content {
      margin-left: 200px;
      padding: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    .website-nav {
      flex-direction: column;
    }

    .nav-sidebar {
      position: static;
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }

    .nav-content {
      margin-left: 0;
      padding: 1rem;
    }

    .category-nav {
      flex-direction: row;
      overflow-x: auto;
      padding: 0.5rem;
    }

    .nav-item {
      white-space: nowrap;
      flex-shrink: 0;
    }

    .websites-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
