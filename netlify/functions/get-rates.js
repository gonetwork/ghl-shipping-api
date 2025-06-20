const EasyPost = require('@easypost/api');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const api = new EasyPost(process.env.EASYPOST_API_KEY);
    // Now also accept length, width, height from the request body
    const { to_zip, weight, from_zip, length, width, height } = JSON.parse(event.body);

    const shipment = await api.Shipment.create({
      to_address: { zip: to_zip, country: 'US' },
      from_address: { zip: from_zip || process.env.DEFAULT_FROM_ZIP, country: 'US' },
      parcel: {
        weight: weight,
        length: length || 10, // default to 10 if not provided
        width: width || 6,    // default to 6 if not provided
        height: height || 4   // default to 4 if not provided
      }
    });

    const upsRates = shipment.rates.filter(rate => rate.carrier === 'UPS')
      .map(rate => ({
        service: rate.service,
        rate: rate.rate,
        delivery_days: rate.delivery_days
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ rates: upsRates }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to get shipping rates' }) };
  }
};