// Список доступных сервисов
const services = [
    { id: 'Wise', name: 'Wise', description: 'Международные переводы' },
    { id: 'ByBit', name: 'ByBit', description: 'Криптовалютная биржа' },
    { id: 'RedotPay', name: 'RedotPay', description: 'Платежная система' },
    { id: 'Grey', name: 'Grey', description: 'Финансовый сервис' },
    { id: 'Payoneer', name: 'Payoneer', description: 'Глобальные платежи' },
    { id: 'Revolut', name: 'Revolut', description: 'Банковское приложение' }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initializeServices();
    initializeCalculator();
});

// Инициализация списка сервисов
function initializeServices() {
    const servicesDropdown = document.getElementById('servicesDropdown');
    const customDropdownSelected = document.getElementById('customDropdownSelected');
    const customDropdownOptions = document.getElementById('customDropdownOptions');
    const selectedText = customDropdownSelected.querySelector('.selected-text');

    // Создаем кастомные опции
    services.forEach(service => {
        // Добавляем опцию в скрытый select для совместимости
        const dropdownOption = document.createElement('option');
        dropdownOption.value = service.id;
        dropdownOption.textContent = service.name;
        servicesDropdown.appendChild(dropdownOption);

        // Создаем кастомную опцию
        const customOption = document.createElement('div');
        customOption.className = 'custom-dropdown-option';
        customOption.dataset.value = service.id;
        customOption.innerHTML = `
            <span class="option-name">${service.name}</span>
            <span class="option-description">${service.description}</span>
        `;
        
        customOption.addEventListener('click', () => {
            selectCustomOption(service.id, service.name);
        });
        
        customDropdownOptions.appendChild(customOption);
    });

    // Обработчик клика на выбранный элемент
    customDropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCustomDropdown();
    });

    // Закрытие при клике вне dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeCustomDropdown();
        }
    });
}

// Выбор опции в кастомном dropdown
function selectCustomOption(serviceId, serviceName) {
    const selectedText = document.querySelector('.selected-text');
    const servicesDropdown = document.getElementById('servicesDropdown');
    
    selectedText.textContent = serviceName;
    servicesDropdown.value = serviceId;
    
    // Обновляем визуальное состояние опций
    document.querySelectorAll('.custom-dropdown-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.value === serviceId) {
            option.classList.add('selected');
        }
    });
    
    closeCustomDropdown();
    showServiceInfo(serviceId);
}

// Переключение dropdown
function toggleCustomDropdown() {
    const customDropdown = document.querySelector('.custom-dropdown');
    const isOpen = customDropdown.classList.contains('open');
    
    if (isOpen) {
        closeCustomDropdown();
    } else {
        openCustomDropdown();
    }
}

// Открыть dropdown
function openCustomDropdown() {
    const customDropdown = document.querySelector('.custom-dropdown');
    customDropdown.classList.add('open');
}

// Закрыть dropdown
function closeCustomDropdown() {
    const customDropdown = document.querySelector('.custom-dropdown');
    customDropdown.classList.remove('open');
}

// Показать информацию о сервисе
function showServiceInfo(serviceId) {
    const serviceInfo = document.getElementById('serviceInfo');
    const serviceInfoName = document.getElementById('serviceInfoName');
    const serviceInfoDescription = document.getElementById('serviceInfoDescription');

    if (!serviceId) {
        serviceInfo.style.display = 'none';
        return;
    }

    const service = services.find(s => s.id === serviceId);
    if (service) {
        serviceInfoName.textContent = service.name;
        serviceInfoDescription.textContent = service.description;
        serviceInfo.style.display = 'block';
    } else {
        serviceInfo.style.display = 'none';
    }
}

// Инициализация калькулятора
function initializeCalculator() {
    const calculateBtn = document.getElementById('calculateBtn');
    const amountInput = document.getElementById('amountInput');

    calculateBtn.addEventListener('click', handleCalculate);

    // Расчет при нажатии Enter
    amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    });
}

// Обработка расчета
async function handleCalculate() {
    const service = document.getElementById('servicesDropdown').value;
    const amount = parseFloat(document.getElementById('amountInput').value);

    // Валидация
    if (!service) {
        showError('Пожалуйста, выберите сервис в блоке "Доступные сервисы"');
        return;
    }

    if (!amount || amount <= 0) {
        showError('Пожалуйста, введите корректную сумму');
        return;
    }

    // Скрываем предыдущие результаты
    hideResult();
    hideError();
    showLoading();

    try {
        // Вызываем serverless функцию
        const response = await fetch('/.netlify/functions/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, service })
        });

        const data = await response.json();

        hideLoading();

        if (!response.ok) {
            showError(data.error || 'Произошла ошибка при расчете');
            return;
        }

        if (data.success) {
            showResult(data);
        } else {
            showError(data.error || 'Неизвестная ошибка');
        }
    } catch (error) {
        hideLoading();
        showError('Ошибка соединения с сервером. Пожалуйста, попробуйте позже.');
        console.error('Error:', error);
    }
}

// Показать результат
function showResult(data) {
    const resultContainer = document.getElementById('result');
    document.getElementById('resultAmount').textContent = formatCurrency(data.amount) + ' ₽';
    document.getElementById('resultCommission').textContent = formatCurrency(data.commission) + ' ₽';
    document.getElementById('resultTotal').textContent = formatCurrency(data.totalAmount) + ' ₽';
    document.getElementById('resultDescription').textContent = data.description;
    
    resultContainer.style.display = 'block';
    
    // Прокрутка к результату
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Скрыть результат
function hideResult() {
    document.getElementById('result').style.display = 'none';
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
