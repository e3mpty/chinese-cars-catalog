// src/services/cbr.js
// Получение курса CNY/RUB через XML-API Банка России

const CBR_API_URL = '/cbr-api/scripts/XML_daily.asp'

/**
 * Загружает курс CNY к RUB с сайта ЦБ РФ.
 * @returns {Promise<{rate: number, date: string}>}
 */
export async function fetchCnyRate() {
  const response = await fetch(CBR_API_URL)

  if (!response.ok) {
    throw new Error(`Ошибка HTTP: ${response.status}`)
  }

  const text = await response.text()
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'application/xml')

  // Получаем дату из атрибута корневого элемента <ValCurs Date="...">
  const dateAttr = xml.querySelector('ValCurs')?.getAttribute('Date') ?? ''

  // Ищем валюту с CharCode = CNY
  const valutes = xml.querySelectorAll('Valute')
  let rateNode = null

  for (const v of valutes) {
    const charCode = v.querySelector('CharCode')?.textContent
    if (charCode === 'CNY') {
      rateNode = v
      break
    }
  }

  if (!rateNode) {
    throw new Error('CNY не найден в ответе ЦБ РФ')
  }

  const nominal = parseInt(rateNode.querySelector('Nominal')?.textContent ?? '1', 10)
  const valueStr = rateNode.querySelector('Value')?.textContent ?? '0'
  // ЦБ РФ возвращает числа с запятой
  const value = parseFloat(valueStr.replace(',', '.'))
  const rate = value / nominal

  return { rate: parseFloat(rate.toFixed(4)), date: dateAttr }
}