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
    const servicesGrid = document.getElementById('servicesGrid');
    const serviceSelect = document.getElementById('serviceSelect');

    services.forEach(service => {
        // Добавляем карточку сервиса
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.dataset.serviceId = service.id;
        serviceCard.innerHTML = `
            <h3>${service.name}</h3>
            <p>${service.description}</p>
        `;
        serviceCard.addEventListener('click', () => {
            selectService(service.id);
        });
        servicesGrid.appendChild(serviceCard);

        // Добавляем опцию в select
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.name;
        serviceSelect.appendChild(option);
    });

    // Обработчик изменения select
    serviceSelect.addEventListener('change', (e) => {
        selectService(e.target.value);
    });
}

// Выбор сервиса
function selectService(serviceId) {
    // Обновляем визуальное выделение
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.serviceId === serviceId) {
            card.classList.add('selected');
        }
    });

    // Обновляем select
    document.getElementById('serviceSelect').value = serviceId;
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
    const service = document.getElementById('serviceSelect').value;
    const amount = parseFloat(document.getElementById('amountInput').value);

    // Валидация
    if (!service) {
        showError('Пожалуйста, выберите сервис');
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
