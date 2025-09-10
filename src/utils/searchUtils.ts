import type { SearchEngine, SearchEngineMap, SearchResult, Category } from "../types/search";
import websitesData from "../data/websites.json";

// 搜索引擎配置
export const searchEngineConfig: SearchEngineMap = {
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
export const getEngineName = (engine: SearchEngine): string => {
  return searchEngineConfig[engine].name;
};

// 构建搜索URL
export const buildSearchUrl = (engine: SearchEngine, query: string): string => {
  return searchEngineConfig[engine].urlBuilder(query);
};

// 热门搜索建议
export const hotSuggestions: string[] = websitesData.hotSuggestions;

// 搜索网站数据
export const searchWebsites = (query: string, categories: Category[]): SearchResult[] => {
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
export const isValidSearchQuery = (query: string): boolean => {
  return query.trim().length > 0;
};

// 执行外部搜索
export const performExternalSearch = (engine: SearchEngine, query: string): void => {
  const url = buildSearchUrl(engine, query);
  openUrlInNewTab(url);
};

// 在新标签页打开URL
export const openUrlInNewTab = (url: string): void => {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
};
