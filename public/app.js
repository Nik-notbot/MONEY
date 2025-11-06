// Список доступных сервисов
const services = [
    { id: 'Wise', name: 'Wise', description: 'Международные переводы', fieldType: 'IBAN' },
    { id: 'ByBit', name: 'ByBit', description: 'Криптовалютная биржа', fieldType: 'BEP-20' },
    { id: 'RedotPay', name: 'RedotPay', description: 'Платежная система', fieldType: 'BEP-20' },
    { id: 'Grey', name: 'Grey', description: 'Финансовый сервис', fieldType: 'BEP-20' },
    { id: 'Revolut', name: 'Revolut', description: 'Банковское приложение', fieldType: 'IBAN' }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeServices();
    initializeCalculator();
});

// Инициализация списка сервисов
function initializeServices() {
    const servicesDropdown = document.getElementById('servicesDropdown');
    const servicesList = document.getElementById('servicesList');

    // Создаем элементы списка сервисов
    services.forEach(service => {
        // Добавляем опцию в скрытый select для совместимости
        const dropdownOption = document.createElement('option');
        dropdownOption.value = service.id;
        dropdownOption.textContent = service.name;
        servicesDropdown.appendChild(dropdownOption);

        // Создаем элемент списка
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-item';
        serviceItem.dataset.value = service.id;
        serviceItem.innerHTML = `
            <div class="service-item-content">
                <span class="service-item-name">${service.name}</span>
                <span class="service-item-description">${service.description}</span>
            </div>
        `;
        
        serviceItem.addEventListener('click', () => {
            selectService(service.id);
        });
        
        servicesList.appendChild(serviceItem);
    });
}

// Выбор сервиса
function selectService(serviceId) {
    const servicesDropdown = document.getElementById('servicesDropdown');
    
    servicesDropdown.value = serviceId;
    
    // Обновляем визуальное состояние элементов списка
    document.querySelectorAll('.service-item').forEach(item => {
        item.classList.remove('selected');
        if (item.dataset.value === serviceId) {
            item.classList.add('selected');
        }
    });
    
    // Показываем/скрываем поля в калькуляторе
    updateCalculatorFields(serviceId);
}

// Обновление полей калькулятора в зависимости от выбранного сервиса
function updateCalculatorFields(serviceId) {
    const emailGroup = document.getElementById('emailGroup');
    const ibanGroup = document.getElementById('ibanGroup');
    const bep20Group = document.getElementById('bep20Group');
    const termsGroup = document.getElementById('termsGroup');
    
    // Скрываем все поля
    emailGroup.style.display = 'none';
    ibanGroup.style.display = 'none';
    bep20Group.style.display = 'none';
    termsGroup.style.display = 'none';
    
    // Очищаем поля
    document.getElementById('emailInput').value = '';
    document.getElementById('ibanInput').value = '';
    document.getElementById('bep20Input').value = '';
    document.getElementById('termsCheckbox').checked = false;
    
    if (!serviceId) {
        return;
    }
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        return;
    }
    
    // Показываем обязательные поля для всех сервисов
    emailGroup.style.display = 'block';
    termsGroup.style.display = 'block';
    
    // Показываем специфичные поля в зависимости от типа
    if (service.fieldType === 'IBAN') {
        ibanGroup.style.display = 'block';
    } else if (service.fieldType === 'BEP-20') {
        bep20Group.style.display = 'block';
    }
}

// Инициализация калькулятора
function initializeCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    const giveInput = document.getElementById('giveInput');
    const receiveInput = document.getElementById('receiveInput');

    calculateBtn.addEventListener('click', handleCalculate);

    // Расчет при нажатии Enter в любом из полей
    giveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    });

    receiveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    });
}

// Обработка расчета
async function handleCalculate() {
    const service = document.getElementById('servicesDropdown').value;
    const giveInput = document.getElementById('giveInput');
    const receiveInput = document.getElementById('receiveInput');
    const giveAmount = parseFloat(giveInput.value);
    const receiveAmount = parseFloat(receiveInput.value);
    const email = document.getElementById('emailInput').value.trim();
    const iban = document.getElementById('ibanInput').value.trim();
    const bep20 = document.getElementById('bep20Input').value.trim();
    const termsAccepted = document.getElementById('termsCheckbox').checked;

    // Валидация
    if (!service) {
        showError('Пожалуйста, выберите сервис в блоке "Доступные сервисы"');
        return;
    }

    // Определяем, какое поле заполнено
    let amount = 0;
    let isGiveAmount = false;
    
    if (giveAmount > 0 && receiveAmount > 0) {
        // Если оба поля заполнены, используем "Отдаю" как основную сумму
        amount = giveAmount;
        isGiveAmount = true;
    } else if (giveAmount > 0) {
        // Если заполнено только "Отдаю", это итоговая сумма к оплате
        // Нужно рассчитать обратно сумму пополнения
        isGiveAmount = true;
        amount = giveAmount;
    } else if (receiveAmount > 0) {
        // Если заполнено только "Получаю", это сумма пополнения
        amount = receiveAmount;
        isGiveAmount = false;
    } else {
        showError('Пожалуйста, введите сумму в одно из полей');
        return;
    }

    if (!amount || amount <= 0) {
        showError('Пожалуйста, введите корректную сумму');
        return;
    }

    // Валидация email
    if (!email) {
        showError('Пожалуйста, введите email');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Пожалуйста, введите корректный email');
        return;
    }

    // Валидация специфичных полей
    const serviceData = services.find(s => s.id === service);
    if (serviceData) {
        if (serviceData.fieldType === 'IBAN' && !iban) {
            showError('Пожалуйста, введите IBAN');
            return;
        }
        if (serviceData.fieldType === 'BEP-20' && !bep20) {
            showError('Пожалуйста, введите BEP-20 адрес');
            return;
        }
    }

    // Валидация согласия с условиями
    if (!termsAccepted) {
        showError('Необходимо согласиться с условиями пользования');
        return;
    }

    // Скрываем предыдущие результаты
    hideResult();
    hideError();
    showLoading();

    try {
        let calculatedAmount = amount;
        
        if (isGiveAmount) {
            // Если заполнено "Отдаю" (итоговая сумма), нужно найти сумму пополнения
            // Используем бинарный поиск для точного расчета
            const targetTotal = amount;
            let low = 0;
            let high = targetTotal;
            let bestAmount = 0;
            let bestDiff = Infinity;
            
            // Делаем несколько итераций бинарного поиска
            for (let iteration = 0; iteration < 15; iteration++) {
                const testAmount = (low + high) / 2;
                
                const response = await fetch('/.netlify/functions/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ amount: testAmount, service })
                });
                
                const testData = await response.json();
                
                if (testData.success) {
                    const diff = Math.abs(testData.totalAmount - targetTotal);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestAmount = testData.amount;
                    }
                    
                    if (diff < 0.01) {
                        // Нашли точное значение
                        calculatedAmount = testData.amount;
                        break;
                    }
                    
                    if (testData.totalAmount < targetTotal) {
                        low = testAmount;
                    } else {
                        high = testAmount;
                    }
                } else {
                    break;
                }
            }
            
            if (bestDiff < 1) {
                calculatedAmount = bestAmount;
            }
        }
        
        // Финальный вызов для получения точных данных
        const response = await fetch('/.netlify/functions/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: calculatedAmount, service })
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            showError(data.error || 'Произошла ошибка при расчете');
            return;
        }

        if (data.success) {
            // Заполняем поля в зависимости от того, что было введено
            if (isGiveAmount) {
                // Если было введено "Отдаю", заполняем "Получаю"
                receiveInput.value = data.amount.toFixed(2);
                giveInput.value = data.totalAmount.toFixed(2);
            } else {
                // Если было введено "Получаю", заполняем "Отдаю"
                giveInput.value = data.totalAmount.toFixed(2);
                receiveInput.value = data.amount.toFixed(2);
            }
        } else {
            showError(data.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        hideLoading();
        showError('Ошибка соединения с сервером. Пожалуйста, попробуйте позже.');
        console.error('Error:', error);
    }
}

// Скрыть результат (очистка полей при изменении сервиса)
function hideResult() {
    // Поля остаются видимыми, но можно очистить при необходимости
}

// Показать ошибку
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Скрыть ошибку
function hideError() {
    document.getElementById('error').style.display = 'none';
}

// Показать загрузку
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('calculateBtn').disabled = true;
}

// Скрыть загрузку
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('calculateBtn').disabled = false;
}

// Форматирование валюты
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
