<template>
  <div class="search-engine">
    <!-- 搜索引擎切换 -->
    <div class="search-engine-tabs">
      <button :class="{ active: currentEngine === 'site' }" @click="switchEngine('site')">站内查询</button>
      <button :class="{ active: currentEngine === 'baidu' }" @click="switchEngine('baidu')">百度查询</button>
      <button :class="{ active: currentEngine === 'bing' }" @click="switchEngine('bing')">必应查询</button>
      <button :class="{ active: currentEngine === 'google' }" @click="switchEngine('google')">
        谷歌查询
      </button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          @keyup.enter="handleSearch"
          @input="handleInputChange"
          class="search-input" />
        <button @click="handleSearch" class="search-button">
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

      <!-- 搜索引擎提示 -->
      <div class="engine-hint">当前使用：{{ currentEngineName }}</div>
    </div>

    <!-- 热门搜索建议 -->
    <div class="hot-suggestions" v-if="!searchQuery && showSuggestions && hotSuggestions.length > 0">
      <h3>热门搜索</h3>
      <div class="suggestion-tags">
        <span
          v-for="(suggestion, index) in hotSuggestions"
          :key="index"
          @click="
            searchQuery = suggestion;
            handleSearch();
          "
          class="suggestion-tag">
          {{ suggestion }}
        </span>
      </div>
    </div>

    <!-- 站内搜索结果 -->
    <div class="search-results" v-if="showResults && searchResults.length > 0">
      <h3>搜索结果 ({{ searchResults.length }} 个)</h3>
      <div class="results-grid">
        <div
          v-for="(result, index) in searchResults"
          :key="index"
          class="result-item"
          @click="openUrlInNewTab(result.url)">
          <div class="result-icon">
            <img :src="result.icon" :alt="result.name" @error="handleImageError" />
            <span v-if="!result.icon" class="icon-fallback">{{ result.name.charAt(0) }}</span>
          </div>
          <div class="result-content">
            <h4>{{ result.name }}</h4>
            <p>{{ result.description }}</p>
            <div class="result-meta">
              <span class="category">{{ result.categoryIcon }} {{ result.category }}</span>
              <span class="url">{{ result.url }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div class="no-results" v-if="showResults && searchResults.length === 0">
      <h3>😢 没有找到相关结果</h3>
      <p>尝试使用其他关键词搜索，或者切换到外部搜索引擎</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from "vue";
  import websitesData from "@/data/websites.json";
  import localforage from "localforage";
  import type { SearchEngine, SearchResult, SearchEngineMap, Category } from "../types/search";

  // 搜索引擎配置
  const searchEngineConfig: SearchEngineMap = {
    site: {
      name: "站内搜索",
      urlBuilder: () => "#",
    },
    baidu: {
      name: "百度",
      urlBuilder: (query: string) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
    },
    bing: {
      name: "必应",
      urlBuilder: (query: string) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    },
    google: {
      name: "谷歌",
      urlBuilder: (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    },
  };

  // 获取搜索引擎名称
  const getEngineName = (engine: SearchEngine): string => {
    return searchEngineConfig[engine].name;
  };

  // 构建搜索URL
  const buildSearchUrl = (engine: SearchEngine, query: string): string => {
    return searchEngineConfig[engine].urlBuilder(query);
  };

  // 热门搜索建议
  const hotSuggestions = ref<string[]>([]);

  const loadHotSuggestions = async () => {
    try {
      const cachedSuggestions = await localforage.getItem<string[]>("hotSuggestions");
      if (cachedSuggestions && Array.isArray(cachedSuggestions)) {
        hotSuggestions.value = cachedSuggestions;
      } else {
        hotSuggestions.value = (websitesData as { hotSuggestions: string[] }).hotSuggestions || [];
      }
    } catch (error) {
      console.error("加载热门搜索建议失败:", error);
      hotSuggestions.value = (websitesData as { hotSuggestions: string[] }).hotSuggestions || [];
    }
  };

  onMounted(() => {
    loadHotSuggestions();
  });

  // 搜索网站数据
  const searchWebsites = (query: string, categories: Category[]): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    categories.forEach((category) => {
      category.websites.forEach((website) => {
        if (
          website.name.toLowerCase().includes(lowerQuery) ||
          website.description.toLowerCase().includes(lowerQuery) ||
          website.url.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            ...website,
            category: category.name,
            categoryIcon: category.icon,
          });
        }
      });
    });

    return results;
  };

  // 验证搜索查询
  const isValidSearchQuery = (query: string): boolean => {
    return query.trim().length > 0;
  };

  // 执行外部搜索
  const performExternalSearch = (engine: SearchEngine, query: string): void => {
    const url = buildSearchUrl(engine, query);
    openUrlInNewTab(url);
  };

  // 在新标签页打开URL
  const openUrlInNewTab = (url: string): void => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  interface Props {
    placeholder?: string;
    showSuggestions?: boolean;
  }

  withDefaults(defineProps<Props>(), {
    placeholder: "请输入搜索关键词...",
    showSuggestions: true,
  });

  // 搜索引擎配置
  const currentEngine = ref<SearchEngine>("baidu");
  const searchQuery = ref("");

  // 获取当前搜索引擎名称
  const currentEngineName = computed(() => getEngineName(currentEngine.value));

  // 站内搜索结果
  const searchResults = ref<SearchResult[]>([]);
  const showResults = ref(false);

  // 清空搜索结果
  const clearSearchResults = () => {
    searchResults.value = [];
    showResults.value = false;
  };

  // 切换搜索引擎
  const switchEngine = (engine: SearchEngine) => {
    currentEngine.value = engine;
    // 切换搜索引擎时清空搜索结果
    clearSearchResults();
  };

  // 处理搜索输入变化
  const handleInputChange = () => {
    if (!searchQuery.value.trim()) {
      // 清空搜索框时清空搜索结果
      clearSearchResults();
    }
  };

  // 处理搜索
  const handleSearch = async () => {
    if (!isValidSearchQuery(searchQuery.value)) return;

    if (currentEngine.value === "site") {
      try {
        // 首先尝试从本地缓存加载数据
        const storedData = await localforage.getItem<Category[]>("websiteCategories");
        let categoriesToSearch: Category[];

        if (storedData && storedData.length > 0) {
          // 使用本地缓存的数据（包含手动新增的内容）
          categoriesToSearch = storedData;
          console.log("使用本地缓存数据进行搜索", storedData);
          console.log(
            "缓存数据中的网站数量:",
            storedData.reduce((total, category) => total + category.websites.length, 0),
          );

          // 调试：打印缓存数据中的所有网站名称
          console.log("缓存数据中的所有网站名称:");
          storedData.forEach((category, index) => {
            console.log(`分类 ${index + 1} (${category.name}):`);
            category.websites.forEach((website, wIndex) => {
              console.log(`  ${wIndex + 1}. ${website.name} - ${website.description || "无描述"}`);
            });
          });
        } else {
          // 如果没有缓存数据，使用JSON文件数据，确保所有网站都有ID
          categoriesToSearch = (websitesData as { categories: Category[] }).categories.map((category) => ({
            ...category,
            websites: category.websites.map((website: any) => ({
              ...website,
              id: website.id || `website-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            })),
          }));
          console.log("使用JSON文件数据进行搜索");
          console.log(
            "JSON数据中的网站数量:",
            categoriesToSearch.reduce((total, category) => total + category.websites.length, 0),
          );
        }

        console.log("搜索关键词:", searchQuery.value);
        const results = searchWebsites(searchQuery.value, categoriesToSearch);
        console.log("搜索结果数量:", results.length);
        console.log("搜索结果:", results);
        searchResults.value = results;
        showResults.value = true;
      } catch (error) {
        console.error("加载搜索数据失败:", error);
        // 出错时使用JSON文件数据作为后备
        const categoriesWithIds = (websitesData as { categories: any[] }).categories.map((category) => ({
          ...category,
          websites: category.websites.map((website: any) => ({
            ...website,
            id: website.id || `website-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
        }));
        searchResults.value = searchWebsites(searchQuery.value, categoriesWithIds);
        showResults.value = true;
      }
    } else {
      // 跳转到外部搜索引擎
      performExternalSearch(currentEngine.value, searchQuery.value);
    }
  };

  // 添加图片加载失败处理函数
  const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
  };

  // 暴露方法给父组件
  defineExpose({
    switchEngine,
    handleSearch,
    getCurrentEngine: () => currentEngine.value,
    getSearchQuery: () => searchQuery.value,
  });
</script>

<style scoped>
  .search-engine {
    width: 100%;
  }

  .search-engine-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .search-engine-tabs button {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
    color: #374151;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .search-engine-tabs button:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-2px);
  }

  .search-engine-tabs button.active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: white;
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.2);
  }

  .search-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto 2rem;
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

  .engine-hint {
    text-align: center;
    margin-top: 1rem;
    color: #6b7280;
    font-size: 0.9rem;
  }

  .hot-suggestions {
    text-align: center;
    color: #374151;
  }

  .hot-suggestions h3 {
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .suggestion-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .suggestion-tag {
    padding: 0.5rem 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #374151;
  }

  .suggestion-tag:hover {
    background: #4f46e5;
    border-color: #4f46e5;
    color: white;
    transform: translateY(-2px);
  }

  /* 搜索结果 */
  .search-results {
    margin-top: 2rem;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 16px;
  }

  .search-results h3 {
    margin-bottom: 1.5rem;
    color: #374151;
    font-weight: 600;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .result-item {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
  }

  .result-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: #4f46e5;
  }

  .result-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .result-icon img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .icon-fallback {
    font-size: 1.25rem;
    font-weight: 600;
    color: #4f46e5;
  }

  .result-content h4 {
    margin: 0 0 0.5rem 0;
    color: #1f2937;
    font-weight: 600;
  }

  .result-content p {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
  }

  .result-meta .category {
    color: #4f46e5;
    font-weight: 500;
  }

  .result-meta .url {
    color: #9ca3af;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 无结果提示 */
  .no-results {
    text-align: center;
    padding: 3rem 2rem;
    color: #6b7280;
  }

  .no-results h3 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  .no-results p {
    margin: 0;
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    .search-engine-tabs {
      gap: 0.5rem;
    }

    .search-engine-tabs button {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .search-input {
      padding: 1rem 1.25rem;
      font-size: 1rem;
    }

    .search-button {
      padding: 0.875rem 1.25rem;
    }
  }
</style>
