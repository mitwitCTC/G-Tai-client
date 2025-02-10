import apiClient from "@/api";


export async function fetchWithRetry(endpoint, params = {}, config = {}) {
  const maxRetries = 10; // 最大重試次數
  let retryCount = 0; // 當前重試次數
  let abortController = null; // 用於追踪當前的 API 呼叫

  while (retryCount < maxRetries) {
    try {
      // 為每次重試創建新的 AbortController
      abortController = new AbortController();
      const signal = abortController.signal;

      // console.warn(`呼叫 API：${endpoint}，第 ${retryCount + 1} 次嘗試`);
      
      // 包裝請求與超時邏輯
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('timeout')); // 超時錯誤
        }, 15000); // 15 秒超時

        apiClient.post(endpoint, params, { ...config, signal })
          .then((res) => {
            clearTimeout(timeout); // 請求成功時清除超時計時器
            resolve(res);
          })
          .catch((err) => {
            clearTimeout(timeout); // 請求失敗時清除超時計時器
            reject(err);
          });
      });

      return response; // 成功返回結果
    } catch (error) {
      retryCount++;
      
      // 僅在明確取消的情況下拋出錯誤
      if (error.name === 'AbortError') {
        console.error('API 呼叫已被取消');
        throw error;
      } else if (retryCount >= maxRetries) {
        // console.error(`API ${endpoint} 錯誤：已達最大重試次數`, error);
        throw new Error('API 呼叫失敗：重試次數已達上限');
      } else if (error.message === 'timeout') {
        // console.warn(`API ${endpoint} 呼叫超時，正在進行第 ${retryCount} 次重試...`);
        console.warn(`API呼叫超時，正在進行第 ${retryCount} 次重試...`);
      } else {
        console.error(`API錯誤：`, error);
        console.warn(`正在進行第 ${retryCount} 次重試...`);
      }
    }
  }
}