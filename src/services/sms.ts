import axios from 'axios';
import twilio from 'twilio';

// Environment variables
const TERMII_API_KEY = Bun.env.TERMII_API_KEY!;
const TWILIO_ACCOUNT_SID = Bun.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = Bun.env.TWILIO_AUTH_TOKEN!;
const TWILIO_PHONE_NUMBER = Bun.env.TWILIO_PHONE_NUMBER!;
const SERVICE_TYPE = Bun.env.SMS_SERVICE_TYPE!;

// Types
type ServiceType = 'twilio' | 'termii' | 'dummy';

interface TermiiResponse {
  status: string;
  message: string;
  [key: string]: any;
}

interface DummyResponse {
  status: string;
  message: string;
}

// Phone number formatter
const formatPhoneNumber = (number: string, service: ServiceType): string => {
  switch (service) {
    case 'twilio':
      if (number.startsWith('0')) {
        return '+234' + number.slice(1);
      } else if (!number.startsWith('+234')) {
        return '+234' + number;
      }
      break;
    case 'termii':
      if (number.startsWith('+234')) {
        return number.slice(1);
      }
      break;
    default:
      throw new Error('Unsupported service');
  }
  return number;
};

// Base interface for SMS services
interface SMSNotificationInterface {
  sendSMSMessage(
    message: string,
    phoneNumber: string,
    apiKey?: string
  ): Promise<any>;
}

// Termii service implementation
class TermiiService implements SMSNotificationInterface {
  async sendSMSMessage(
    message: string,
    phoneNumber: string,
    apiKey: string = TERMII_API_KEY
  ): Promise<TermiiResponse> {
    const formattedPhone = formatPhoneNumber(phoneNumber, 'termii');
    const url = 'https://v3.api.termii.com/api/sms/send';
    
    const payload = {
      to: formattedPhone,
      from: 'Hono',
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: apiKey
    };

    try {
      const response = await axios.post<TermiiResponse>(url, payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Termii API error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Twilio service implementation
class TwilioService implements SMSNotificationInterface {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  async sendSMSMessage(
    message: string,
    phoneNumber: string,
    apiKey: string = TWILIO_PHONE_NUMBER
  ): Promise<string> {
    const formattedPhone = formatPhoneNumber(phoneNumber, 'twilio');
    const fromPhoneNumber = apiKey;

    try {
      const twilioMessage = await this.client.messages.create({
        body: message,
        from: fromPhoneNumber,
        to: formattedPhone
      });
      return twilioMessage.sid;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Twilio API error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Dummy service implementation for testing
class DummyService implements SMSNotificationInterface {
  async sendSMSMessage(
    message: string,
    phoneNumber: string,
    apiKey: string | null = null
  ): Promise<DummyResponse> {
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    return {
      status: 'success',
      message: 'Dummy SMS sent'
    };
  }
}

// Main SMS notification service
class SMSNotificationService {
  private service: SMSNotificationInterface;

  constructor() {
    switch (SERVICE_TYPE as ServiceType) {
      case 'termii':
        this.service = new TermiiService();
        break;
      case 'twilio':
        this.service = new TwilioService();
        break;
      case 'dummy':
        this.service = new DummyService();
        break;
      default:
        throw new Error(`Unsupported service type: ${SERVICE_TYPE}`);
    }
  }

  async sendSMSMessage(message: string, phoneNumber: string): Promise<any> {
    if (!this.service) {
      throw new Error('No SMS service has been initialized.');
    }
    return await this.service.sendSMSMessage(message, phoneNumber);
  }
}

export { SMSNotificationService, ServiceType };