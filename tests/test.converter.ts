import CurrencyConverter from '../src/services/converter';

const converter = new CurrencyConverter();

async function runConversion() {
  const result = await converter.from('USD').to('NGN').setAmount(100).convert();

  // With caching
  converter.setupRatesCache({
    isRatesCaching: true,
    ratesCacheDuration: 3600
  });

  console.log('This is the result: ', result);
}

runConversion().catch(console.error);
