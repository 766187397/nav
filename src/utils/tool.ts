/**
 * 防抖函数（Debounce）
 * @description 防抖函数会在事件停止触发后，等待指定的时间再执行函数。
 * @param {Function} func 函数
 * @param {number} wait 时间毫秒（默认300毫秒）
 * @returns {Function} 返回防抖处理后的函数。
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number = 300
): {
  (...args: Parameters<T>): void;
  destroy(): void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    // 直接使用 this 调用，避免变量别名
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func.apply(this, args);
    }, wait);
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };

  debounced.destroy = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/**
 * 节流函数，用于限制函数在指定时间间隔内的执行频率。
 * @param {Function} func - 需要节流处理的函数。
 * @param {number} [wait=300] - 节流时间间隔（毫秒）。
 * @returns {Function} 返回节流处理后的函数。
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number = 300
): {
  (...args: Parameters<T>): void;
  destroy(): void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime = 0;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastCallTime = now;
      func.apply(lastThis, lastArgs);
      lastArgs = null;
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCallTime = Date.now();
        func.apply(lastThis, lastArgs!);
        lastArgs = null;
        timer = null;
      }, remaining);
    }
  };

  /**
   * 销毁函数，用于清理定时器和相关状态变量，避免内存泄漏。
   */
  throttled.destroy = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}
