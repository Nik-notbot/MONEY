// Список доступных сервисов
const services = [
    { id: 'Wise', name: 'Wise', description: 'Международные переводы', fieldType: 'IBAN' },
    { id: 'ByBit', name: 'ByBit', description: 'Криптовалютная биржа', fieldType: 'BEP-20' },
    { id: 'RedotPay', name: 'RedotPay', description: 'Платежная система', fieldType: 'BEP-20' },
    { id: 'Grey', name: 'Grey', description: 'Финансовый сервис', fieldType: 'BEP-20' },
    { id: 'Revolut', name: 'Revolut', description: 'Банковское приложение', fieldType: 'IBAN' },
    { id: 'Neteller', name: 'Neteller', description: 'Электронный кошелек', fieldType: 'IBAN' }
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
    const giveInput = document.getElementById('giveInput');
    const receiveInput = document.getElementById('receiveInput');
    
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
    
    // Очищаем поля сумм и сбрасываем флаги
    giveInput.value = '';
    receiveInput.value = '';
    lastCalculatedGive = '';
    lastCalculatedReceive = '';
    
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
    
    // Маппинг сервисов на страницы инструкций
    const instructionPages = {
        'Wise': 'instructions-wise.html',
        'ByBit': 'instructions-bybit.html',
        'RedotPay': 'instructions-redotpay.html',
        'Grey': 'instructions-grey.html',
        'Revolut': 'instructions-revolut.html',
        'Neteller': 'instructions-neteller.html'
    };
    
    // Показываем специфичные поля в зависимости от типа
    if (service.fieldType === 'IBAN') {
        ibanGroup.style.display = 'block';
        // Обновляем ссылку на инструкцию
        const ibanLink = document.getElementById('ibanInstructionLink');
        if (ibanLink && instructionPages[serviceId]) {
            ibanLink.href = instructionPages[serviceId];
        }
    } else if (service.fieldType === 'BEP-20') {
        bep20Group.style.display = 'block';
        // Обновляем ссылку на инструкцию
        const bep20Link = document.getElementById('bep20InstructionLink');
        if (bep20Link && instructionPages[serviceId]) {
            bep20Link.href = instructionPages[serviceId];
        }
    }
}

// Debounce функция для оптимизации запросов
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Автоматический расчет при вводе
let isCalculating = false;
let lastCalculatedGive = '';
let lastCalculatedReceive = '';

async function autoCalculate(fieldType) {
    if (isCalculating) return;
    
    const service = document.getElementById('servicesDropdown').value;
    if (!service) return;
    
    const giveInput = document.getElementById('giveInput');
    const receiveInput = document.getElementById('receiveInput');
    const giveValue = giveInput.value.trim();
    const receiveValue = receiveInput.value.trim();
    
    // Предотвращаем бесконечный цикл
    if (fieldType === 'give' && giveValue === lastCalculatedGive) return;
    if (fieldType === 'receive' && receiveValue === lastCalculatedReceive) return;
    
    let amount = 0;
    let isGiveAmount = false;
    
    if (fieldType === 'give' && giveValue && parseFloat(giveValue) > 0) {
        amount = parseFloat(giveValue);
        isGiveAmount = true;
    } else if (fieldType === 'receive' && receiveValue && parseFloat(receiveValue) > 0) {
        amount = parseFloat(receiveValue);
        isGiveAmount = false;
    } else {
        return;
    }
    
    if (!amount || amount <= 0) return;
    
    isCalculating = true;
    
    try {
        let calculatedAmount = amount;
        
        if (isGiveAmount) {
            // Если введено "Отдаю", используем упрощенный расчет для скорости
            // Приблизительная оценка комиссии
            const estimatedCommissionPercent = 1.8;
            const estimatedFixedFee = 40;
            const estimatedMinCommission = 120;
            
            // Итеративный расчет для приближения
            let testAmount = amount * 0.95;
            for (let i = 0; i < 5; i++) {
                const testCommission = Math.max(testAmount * estimatedCommissionPercent / 100 + estimatedFixedFee, estimatedMinCommission);
                const testTotal = testAmount + testCommission;
                if (Math.abs(testTotal - amount) < 0.1) break;
                testAmount = amount - testCommission;
                if (testAmount < 0) testAmount = 0;
            }
            calculatedAmount = testAmount;
        }
        
        // Вызываем serverless функцию
        const response = await fetch('/.netlify/functions/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: calculatedAmount, service })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Обновляем второе поле
            if (isGiveAmount) {
                receiveInput.value = data.amount.toFixed(2);
                lastCalculatedReceive = receiveInput.value;
            } else {
                giveInput.value = data.totalAmount.toFixed(2);
                lastCalculatedGive = giveInput.value;
            }
        }
    } catch (error) {
        console.error('Auto calculate error:', error);
    } finally {
        isCalculating = false;
    }
}

// Debounced версия автоматического расчета
const debouncedAutoCalculate = debounce(autoCalculate, 500);

// Инициализация калькулятора
function initializeCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    const giveInput = document.getElementById('giveInput');
    const receiveInput = document.getElementById('receiveInput');

    calculateBtn.addEventListener('click', handleCalculate);

    // Автоматический расчет при вводе
    giveInput.addEventListener('input', (e) => {
        const currentValue = e.target.value.trim();
        // Очищаем второе поле только если значение изменилось вручную (не программно)
        if (currentValue && currentValue !== lastCalculatedGive) {
            // Очищаем только если второе поле было заполнено автоматически
            if (receiveInput.value === lastCalculatedReceive) {
                receiveInput.value = '';
                lastCalculatedReceive = '';
            }
        }
        debouncedAutoCalculate('give');
    });

    receiveInput.addEventListener('input', (e) => {
        const currentValue = e.target.value.trim();
        // Очищаем первое поле только если значение изменилось вручную (не программно)
        if (currentValue && currentValue !== lastCalculatedReceive) {
            // Очищаем только если первое поле было заполнено автоматически
            if (giveInput.value === lastCalculatedGive) {
                giveInput.value = '';
                lastCalculatedGive = '';
            }
        }
        debouncedAutoCalculate('receive');
    });

    // Расчет при нажатии Enter в любом из полей
    giveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCalculate();
        }
    });

    receiveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
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
