import {
  PushNotificationService,
  DeviceType
} from '../src/services/notification';

// Test function
const testPushNotification = async () => {
  // Set device type: 'web', 'android', or 'ios'
  const deviceType: DeviceType = 'web'; // Change as needed

  // Initialize push notification service
  const pushService = new PushNotificationService(deviceType);

  // Replace with actual FCM token of the target device
  const registrationToken = 'your-device-fcm-token';

  // Send push notification
  try {
    await pushService.sendPushNotification(
      'Test Notification',
      'This is a test push notification.',
      registrationToken,
      { customKey: 'Custom Value' } // Optional data payload
    );
    console.log('Push notification sent successfully.');
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};

// Run the test
testPushNotification();
