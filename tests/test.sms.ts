import { SMSNotificationService } from '../src/services/sms.service'; // Adjust the import path as needed

const testSMS = async () => {
  const smsService = new SMSNotificationService();
  const testPhoneNumber = '+2348056042384'; // Replace with a valid test number
  const testMessage = 'This is a test SMS from the SMS service.';

  try {
    const response = await smsService.sendSMSMessage(
      testMessage,
      testPhoneNumber
    );
    console.log('SMS sent successfully:', response);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
};

testSMS();
