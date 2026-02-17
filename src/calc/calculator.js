// src/calc/calculator.js
// Упрощённая модель расчёта ориентировочной стоимости ввоза авто в РФ физлицом

/**
 * Таблица ставок пошлины (% от таможенной стоимости) по объёму двигателя (л).
 * Источник: упрощённая учебная модель на основе публичных данных.
 * НЕ является официальным тарифом.
 */
const DUTY_TABLE = [
    { maxL: 1.0,  rate: 0.54 },
    { maxL: 1.8,  rate: 0.48 },
    { maxL: 2.3,  rate: 0.50 },
    { maxL: 3.0,  rate: 0.60 },
    { maxL: 3.5,  rate: 0.65 },
    { maxL: Infinity, rate: 0.70 }
  ]
  
  /**
   * Таблица утильсбора (рублей) по объёму двигателя (л).
   * Учебная упрощённая модель.
   */
  const RECYCLING_TABLE = [
    { maxL: 1.0,  base: 20000 },
    { maxL: 2.0,  base: 35000 },
    { maxL: 3.0,  base: 50000 },
    { maxL: 3.5,  base: 65000 },
    { maxL: Infinity, base: 85000 }
  ]
  
  /**
   * Получить ставку пошлины по объёму двигателя.
   * Для электромобилей (engineL === 0) — ставка 0.
   */
  function getDutyRate(engineL) {
    if (engineL === 0) return 0 // электромобиль
    for (const row of DUTY_TABLE) {
      if (engineL <= row.maxL) return row.rate
    }
    return DUTY_TABLE[DUTY_TABLE.length - 1].rate
  }
  
  /**
   * Получить сумму утильсбора по объёму двигателя.
   * Для электромобилей — фиксированная ставка.
   */
  function getRecyclingFee(engineL) {
    if (engineL === 0) return 556200 // утильсбор для электромобилей (учебное значение)
    for (const row of RECYCLING_TABLE) {
      if (engineL <= row.maxL) return row.base
    }
    return RECYCLING_TABLE[RECYCLING_TABLE.length - 1].base
  }
  
  /**
   * Форматирует число в рубли.
   */
  function formatRub(amount) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  /**
   * Основная функция расчёта.
   * @param {number} priceCny — цена авто в юанях
   * @param {number} rate — курс CNY/RUB
   * @param {number} engineL — объём двигателя в литрах (0 для электро)
   * @returns {{baseRub: number, duty: number, recycling: number, total: number, breakdown: Array}}
   */
  export function calculate(priceCny, rate, engineL) {
    const baseRub = priceCny * rate
    const dutyRate = getDutyRate(engineL)
    const duty = baseRub * dutyRate
    const recycling = getRecyclingFee(engineL)
    const total = baseRub + duty + recycling
  
    const breakdown = [
      { label: 'Цена авто (CNY)', value: `${priceCny.toLocaleString('ru-RU')} ¥` },
      { label: 'Курс CNY/RUB', value: `${rate} ₽` },
      { label: 'Базовая стоимость в руб.', value: formatRub(baseRub) },
      { label: `Таможенная пошлина (${(dutyRate * 100).toFixed(0)}%)`, value: formatRub(duty) },
      { label: 'Утилизационный сбор', value: formatRub(recycling) },
      { label: '⮕ Итого (ориентировочно)', value: formatRub(total) }
    ]
  
    return { baseRub, duty, recycling, total, breakdown }
  }