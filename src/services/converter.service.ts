import NodeCache from 'node-cache';
import axios from 'axios';

interface ConverterConfig {
  apiKey?: string;
  isDecimalComma?: boolean;
}

interface CacheOptions {
  isRatesCaching?: boolean;
  ratesCacheDuration?: number;
}

interface ExchangeRateResponse {
  rates: {
    [key: string]: number;
  };
  [key: string]: any;
}

class CurrencyConverter {
  private apiKey: string;
  private baseUrl: string;
  private isDecimalComma: boolean;
  private fromCurrency: string | null;
  private toCurrency: string | null;
  private amount: number | null;
  private cache: NodeCache;
  private isRatesCaching: boolean;
  private ratesCacheDuration: number;

  constructor(config: ConverterConfig = {}) {
    this.apiKey = config.apiKey || Bun.env.OPENEXCHANGE_API_KEY!;

    if (!this.apiKey) {
      throw new Error('OpenExchange API key is required');
    }

    this.baseUrl = 'https://open.exchangerate-api.com/v6';
    this.isDecimalComma = config.isDecimalComma || false;
    this.fromCurrency = null;
    this.toCurrency = null;
    this.amount = null;
    this.cache = new NodeCache();
    this.isRatesCaching = false;
    this.ratesCacheDuration = 3600;
  }

  /**
   * Set the source currency
   */
  from(currency: string): this {
    console.log('Setting from currency:', currency);
    this.fromCurrency = currency;
    return this;
  }

  /**
   * Set the target currency
   */
  to(currency: string): this {
    console.log('Setting to currency:', currency);
    this.toCurrency = currency;
    return this;
  }

  /**
   * Set the amount to convert
   */
  setAmount(value: number): this {
    console.log('Setting amount:', value);
    this.amount = value;
    return this;
  }

  /**
   * Perform the currency conversion
   */
  async convert(amount: number | null = null): Promise<number | string> {
    if (amount !== null) {
      this.amount = amount;
    }

    if (!this.amount) {
      throw new Error('Amount is required for conversion');
    }

    try {
      const rate = await this.getRates();
      const result = this.amount * rate;
      return this.isDecimalComma ? result.toString().replace('.', ',') : result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Conversion failed: ${error.message}`);
      }
      throw new Error('Conversion failed: Unknown error');
    }
  }

  /**
   * Fetch exchange rates from the API or cache
   */
  private async getRates(): Promise<number> {
    if (!this.fromCurrency || !this.toCurrency) {
      throw new Error('From and To currencies are required');
    }

    const cacheKey = `${this.fromCurrency}-${this.toCurrency}`;

    if (this.isRatesCaching) {
      const cachedRate = this.cache.get<number>(cacheKey);
      if (cachedRate !== undefined) {
        return cachedRate;
      }
    }

    try {
      const response = await axios.get<ExchangeRateResponse>(
        `${this.baseUrl}/latest/${this.fromCurrency}`,
        {
          params: {
            app_id: this.apiKey
          }
        }
      );

      if (!response.data || !response.data.rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      const rate = response.data.rates[this.toCurrency];

      if (!rate) {
        throw new Error(`Rate not found for ${this.toCurrency}`);
      }

      if (this.isRatesCaching) {
        this.cache.set(cacheKey, rate, this.ratesCacheDuration);
      }

      return rate;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch exchange rates: ${error.message}`);
      }
      throw new Error('Failed to fetch exchange rates: Unknown error');
    }
  }

  /**
   * Configure caching settings
   */
  setupRatesCache(options: CacheOptions = {}): this {
    this.isRatesCaching = options.isRatesCaching || false;
    this.ratesCacheDuration = options.ratesCacheDuration || 3600;
    return this;
  }
}

export default CurrencyConverter;
