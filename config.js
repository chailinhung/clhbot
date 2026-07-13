// === GitHub Frontend Firestore Config ===
const FIRESTORE_PROJECT_ID = "clhbot"; // 請填入您的 Firebase 專案 ID
const FIRESTORE_API_KEY = "AIzaSyCExKi_r1hqwCdX-0lPAx73lb38zlXNYl0"; // 若有設定 API Key 則填寫，否則留空

/**
 * 輕量級 Firestore REST API 請求工具 (不需引入 SDK)
 */
async function firebaseFetch(path, options = {}) {
  let url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/${path}`;
  if (FIRESTORE_API_KEY) {
    url += `?key=${FIRESTORE_API_KEY}`;
  }
  
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (options.payload) {
    fetchOptions.body = JSON.stringify({
      fields: toFirestoreFields(options.payload)
    });
  }
  
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore request failed: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * 獲取 Firestore 集合所有文檔的輔助工具
 */
async function getCollection(path) {
  try {
    const res = await firebaseFetch(path);
    if (!res || !res.documents) return [];
    return res.documents.map(doc => {
      const docId = doc.name.substring(doc.name.lastIndexOf('/') + 1);
      return {
        id: docId,
        ...fromFirestoreFields(doc.fields)
      };
    });
  } catch (err) {
    console.error(`Error fetching collection ${path}:`, err);
    return [];
  }
}

/**
 * 將標準 JSON 物件轉換為 Firestore 的 fields 欄位格式
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (val instanceof Date) {
      fields[key] = { timestampValue: val.toISOString() };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => {
            if (typeof item === 'object') {
              return { mapValue: { fields: toFirestoreFields(item) } };
            }
            return toFirestoreFields({ temp: item }).temp;
          })
        }
      };
    } else if (typeof val === 'object' && val !== null) {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

/**
 * 將 Firestore 的 fields 欄位格式還原為標準 JSON 物件
 */
function fromFirestoreFields(fields) {
  if (!fields) return {};
  const obj = {};
  for (const key in fields) {
    const wrapper = fields[key];
    if ('stringValue' in wrapper) {
      obj[key] = wrapper.stringValue;
    } else if ('doubleValue' in wrapper) {
      obj[key] = Number(wrapper.doubleValue);
    } else if ('integerValue' in wrapper) {
      obj[key] = Number(wrapper.integerValue);
    } else if ('booleanValue' in wrapper) {
      obj[key] = wrapper.booleanValue;
    } else if ('timestampValue' in wrapper) {
      obj[key] = wrapper.timestampValue;
    } else if ('arrayValue' in wrapper) {
      const vals = wrapper.arrayValue.values || [];
      obj[key] = vals.map(item => {
        if ('mapValue' in item) {
          return fromFirestoreFields(item.mapValue.fields);
        }
        const keys = Object.keys(item);
        return item[keys[0]];
      });
    } else if ('mapValue' in wrapper) {
      obj[key] = fromFirestoreFields(wrapper.mapValue.fields);
    }
  }
  return obj;
}
