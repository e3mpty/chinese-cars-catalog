// src/main.js
import './style.css'
import carsData from './data/cars.json'
import { fetchCnyRate } from './services/cbr.js'
import { calculate } from './calc/calculator.js'
import { loadHistory, saveRecord, clearHistory } from './storage/history.js'

// =====================
// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// =====================
let currentRate = null

// =====================
// РОУТИНГ
// =====================
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'))
  document.getElementById(name)?.classList.remove('hidden')
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.section === name)
  })
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'catalog'
  showSection(hash)
  if (hash === 'history') renderHistory()
  if (hash === 'calculator' && !currentRate) loadRate()
}

window.addEventListener('hashchange', handleRoute)
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const section = link.dataset.section
    window.location.hash = section
  })
})

// =====================
// КАТАЛОГ
// =====================
function renderCatalog(cars) {
  const grid = document.getElementById('cars-grid')
  if (!cars.length) {
    grid.innerHTML = '<p>Ничего не найдено</p>'
    return
  }

  grid.innerHTML = cars.map(car => `
    <div class="car-card">
      <img
        src="${car.imageUrl || 'https://placehold.co/400x180?text=' + encodeURIComponent(car.brand)}"
        alt="${car.brand} ${car.model}"
        loading="lazy"
      />
      <div class="car-card-body">
        <div class="car-card-title">${car.brand} ${car.model}</div>
        <div class="car-card-price">${car.priceCny.toLocaleString('ru-RU')} ¥</div>
        <div class="car-card-specs">
          ${car.engineL > 0 ? car.engineL + ' л' : 'Электро'} •
          ${car.bodyType} • ${car.year}
        </div>
        <p style="font-size:0.82rem; color:#666; margin-top:4px;">${car.description}</p>
        <button
          class="btn btn-primary"
          style="margin-top:10px;"
          onclick="window.calcFromCar(${car.id})"
        >
          Рассчитать стоимость ввоза
        </button>
      </div>
    </div>
  `).join('')
}

function initCatalog() {
  const filter = document.getElementById('brand-filter')
  const brands = [...new Set(carsData.map(c => c.brand))].sort()
  brands.forEach(b => {
    const opt = document.createElement('option')
    opt.value = b
    opt.textContent = b
    filter.appendChild(opt)
  })

  filter.addEventListener('change', () => {
    const val = filter.value
    renderCatalog(val ? carsData.filter(c => c.brand === val) : carsData)
  })

  renderCatalog(carsData)
}

// Глобальный обработчик кнопки из карточки
window.calcFromCar = function(carId) {
  const car = carsData.find(c => c.id === carId)
  if (!car) return
  document.getElementById('price-cny').value = car.priceCny
  document.getElementById('engine-l').value = car.engineL
  document.getElementById('car-year').value = car.year
  window.location.hash = 'calculator'
}

// =====================
// КУРС ЦБ РФ
// =====================
async function loadRate() {
  const rateBlock = document.getElementById('rate-value')
  rateBlock.textContent = 'Загрузка курса ЦБ РФ...'

  try {
    const { rate, date } = await fetchCnyRate()
    currentRate = rate
    rateBlock.textContent = `Курс CNY/RUB: ${rate} ₽ (на ${date}, ЦБ РФ)`
    document.getElementById('rate-manual-block').classList.add('hidden')
  } catch (err) {
    console.error('Ошибка загрузки курса:', err)
    rateBlock.textContent = '⚠️ Не удалось загрузить курс ЦБ РФ. Введите вручную:'
    document.getElementById('rate-manual-block').classList.remove('hidden')
    document.getElementById('retry-rate-btn').classList.remove('hidden')
  }
}

document.getElementById('retry-rate-btn')?.addEventListener('click', loadRate)

// =====================
// КАЛЬКУЛЯТОР
// =====================
document.getElementById('calc-form').addEventListener('submit', function(e) {
  e.preventDefault()

  const priceCny = parseFloat(document.getElementById('price-cny').value)
  const engineL = parseFloat(document.getElementById('engine-l').value)

  // Определяем актуальный курс
  let rate = currentRate
  if (!rate) {
    const manualRate = parseFloat(document.getElementById('manual-rate').value)
    if (!manualRate || manualRate <= 0) {
      alert('Введите курс CNY/RUB вручную')
      return
    }
    rate = manualRate
  }

  if (isNaN(priceCny) || priceCny <= 0 || isNaN(engineL) || engineL < 0) {
    alert('Проверьте введённые данные')
    return
  }

  const result = calculate(priceCny, rate, engineL)

  // Рендер результата
  const table = document.getElementById('result-table')
  table.innerHTML = result.breakdown.map(row => `
    <tr>
      <td>${row.label}</td>
      <td style="text-align:right;">${row.value}</td>
    </tr>
  `).join('')

  document.getElementById('calc-result').classList.remove('hidden')
  document.getElementById('calc-result').scrollIntoView({ behavior: 'smooth' })

  // Сохранение в историю
  const yearVal = document.getElementById('car-year').value
  saveRecord({
    carLabel: 'Ручной расчёт',
    priceCny,
    rate,
    engineL,
    duty: result.duty,
    recycling: result.recycling,
    total: result.total,
    date: new Date().toISOString(),
    year: yearVal
  })
})

// =====================
// ИСТОРИЯ
// =====================
function renderHistory() {
  const list = document.getElementById('history-list')
  const items = loadHistory()

  if (!items.length) {
    list.innerHTML = '<p>История пуста</p>'
    return
  }

  list.innerHTML = items.map(item => `
    <div class="history-item">
      <strong>${item.carLabel}</strong>
      <div>${item.priceCny?.toLocaleString('ru-RU')} ¥ × ${item.rate} ₽ | Двигатель: ${item.engineL > 0 ? item.engineL + ' л' : 'Электро'}</div>
      <div class="history-total">
        Итого: ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(item.total)}
      </div>
      <div class="history-date">${new Date(item.date).toLocaleString('ru-RU')}</div>
    </div>
  `).join('')
}

document.getElementById('clear-history-btn').addEventListener('click', () => {
  if (confirm('Очистить всю историю расчётов?')) {
    clearHistory()
    renderHistory()
  }
})

// =====================
// ИНИЦИАЛИЗАЦИЯ
// =====================
initCatalog()
handleRoute()