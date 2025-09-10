// 网站数据类型
export interface Website {
  name: string;
  url: string;
  description: string;
  icon?: string;
}

// 分类数据类型
export interface Category {
  name: string;
  icon: string;
  websites: Website[];
}

// 网站数据整体结构
export interface WebsitesData {
  categories: Category[];
}

// 搜索结果类型
export interface SearchResult {
  name: string;
  url: string;
  description: string;
  icon?: string;
  category: string;
  categoryIcon: string;
}

// 搜索引擎类型
export type SearchEngine = 'site' | 'baidu' | 'bing' | 'google';

// 搜索引擎配置
export interface SearchEngineConfig {
  name: string;
  urlBuilder: (query: string) => string;
}

// 搜索引擎映射
export type SearchEngineMap = Record<SearchEngine, SearchEngineConfig>;