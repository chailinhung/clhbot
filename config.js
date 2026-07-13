// === GitHub Frontend Config ===
// 請填入您的 Firebase Realtime Database 網址 (結尾不需要斜線)
const FIREBASE_DB_URL = "https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com";

/**
 * 輕量級 Firebase Realtime Database 請求工具 (不需引入 SDK)
 */
async function firebaseFetch(path, options = {}) {
  const url = `${FIREBASE_DB_URL.replace(/\/$/, '')}/${path}.json`;
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (options.payload) {
    fetchOptions.body = JSON.stringify(options.payload);
  }
  
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Firebase RTDB request failed: ${response.statusText}`);
  }
  return response.json();
}
