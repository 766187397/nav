/**
 * 表情符号数据的类型定义
 */

/**
 * 表情符号接口
 */
interface Emoji {
  value: string;
  name: string;
  category: string;
}

/**
 * 表情符号数据接口
 */
interface EmojisData {
  emojis: Emoji[];
}

/**
 * 默认导出的表情符号数据
 */
declare const emojisData: EmojisData;

export default emojisData;
export type { Emoji, EmojisData };