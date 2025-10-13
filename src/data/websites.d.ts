/**
 * 网站导航数据的类型定义
 */

/**
 * 网站信息接口
 */
interface Website {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
}

/**
 * 分类信息接口
 */
interface Category {
  id: string;
  name: string;
  icon: string;
  websites: Website[];
}

/**
 * 网站导航数据接口
 */
interface WebsitesData {
  hotSuggestions: string[];
  categories: Category[];
}

/**
 * 默认导出的网站导航数据
 */
declare const websitesData: WebsitesData;

export default websitesData;
export type { Website, Category, WebsitesData };