// Serverless функция для расчета суммы к оплате
// Логика расчета защищена на сервере

exports.handler = async (event, context) => {
  // Разрешаем CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Обработка preflight запроса
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { amount, service } = JSON.parse(event.body);

    // Валидация входных данных
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Неверная сумма' })
      };
    }

    if (!service) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Сервис не выбран' })
      };
    }

    // Логика расчета комиссии для каждого сервиса
    // Эти данные защищены на сервере и не могут быть изменены клиентом
    const serviceRates = {
      'Wise': {
        commissionPercent: 1.5,
        fixedFee: 50,
        minCommission: 100,
        description: 'Комиссия Wise: 1.5% + 50₽ (минимум 100₽)'
      },
      'ByBit': {
        commissionPercent: 2.0,
        fixedFee: 0,
        minCommission: 150,
        description: 'Комиссия ByBit: 2% (минимум 150₽)'
      },
      'RedotPay': {
        commissionPercent: 1.8,
        fixedFee: 30,
        minCommission: 120,
        description: 'Комиссия RedotPay: 1.8% + 30₽ (минимум 120₽)'
      },
      'Grey': {
        commissionPercent: 2.2,
        fixedFee: 40,
        minCommission: 130,
        description: 'Комиссия Grey: 2.2% + 40₽ (минимум 130₽)'
      },
      'Revolut': {
        commissionPercent: 1.6,
        fixedFee: 45,
        minCommission: 105,
        description: 'Комиссия Revolut: 1.6% + 45₽ (минимум 105₽)'
      }
    };

    const rate = serviceRates[service];
    if (!rate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Неизвестный сервис' })
      };
    }

    // Расчет комиссии
    const percentCommission = (amount * rate.commissionPercent) / 100;
    const totalCommission = percentCommission + rate.fixedFee;
    const finalCommission = Math.max(totalCommission, rate.minCommission);
    
    // Итоговая сумма к оплате
    const totalAmount = amount + finalCommission;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        amount: amount,
        commission: Math.round(finalCommission * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        description: rate.description,
        breakdown: {
          percentCommission: Math.round(percentCommission * 100) / 100,
          fixedFee: rate.fixedFee,
          minCommission: rate.minCommission
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ошибка сервера: ' + error.message })
    };
  }
};
