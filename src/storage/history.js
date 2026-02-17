// src/storage/history.js
const STORAGE_KEY = 'calc_history'

/**
 * Загрузить историю расчётов.
 * @returns {Array}
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Сохранить запись в историю.
 * @param {Object} record
 */
export function saveRecord(record) {
  const history = loadHistory()
  history.unshift({ ...record, id: Date.now() })
  // Ограничиваем 20 записями
  if (history.length > 20) history.splice(20)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

/**
 * Очистить историю.
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}