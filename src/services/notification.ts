import admin  from "firebase-admin";

// Define interfaces
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface NotificationData {
  [key: string]: string;
}

// Firebase service account configuration
const serviceAccount: ServiceAccount = {
  type: Bun.env.FIREBASE_TYPE!,
  project_id: Bun.env.FIREBASE_PROJECT_ID!,
  private_key_id: Bun.env.FIREBASE_PRIVATE_KEY_ID!,
  private_key: Bun.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  client_email: Bun.env.FIREBASE_CLIENT_EMAIL!,
  client_id: Bun.env.FIREBASE_CLIENT_ID!,
  auth_uri: Bun.env.FIREBASE_AUTH_URI!,
  token_uri: Bun.env.FIREBASE_TOKEN_URI!,
  auth_provider_x509_cert_url: Bun.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL!,
  client_x509_cert_url: Bun.env.FIREBASE_CLIENT_X509_CERT_URL!
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

console.log('Firebase Admin initialized successfully.');

// Device interface definition
interface DeviceInterface {
  sendPushNotification(
    title: string,
    body: string,
    registrationToken: string,
    data?: NotificationData
  ): Promise<void>;
}

// Web Push Notification implementation
class WebPushNotification implements DeviceInterface {
  async sendPushNotification(
    title: string,
    body: string,
    registrationToken: string,
    data: NotificationData = {}
  ): Promise<void> {
    if (!data.summary) data.summary = body;
    
    const message: admin.messaging.Message = {
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: Bun.env.LOGO_ICON_PATH
        },
        data
      },
      token: registrationToken
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent web message:', response);
    } catch (error) {
      console.log('Error sending web message:', error);
      throw error;
    }
  }
}

// Android Push Notification implementation
class AndroidPushNotification implements DeviceInterface {
  async sendPushNotification(
    title: string,
    body: string,
    registrationToken: string,
    data: NotificationData = {}
  ): Promise<void> {
    if (!data.summary) data.summary = body;

    const message: admin.messaging.Message = {
      android: {
        notification: {
          title,
          body,
          icon: Bun.env.LOGO_ICON_PATH,
          color: '#f45342'
        }
      },
      data,
      token: registrationToken
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent Android push message:', response);
    } catch (error) {
      console.log('Error sending Android message:', error);
      throw error;
    }
  }
}

// iOS Push Notification implementation
class IOSPushNotification implements DeviceInterface {
  async sendPushNotification(
    title: string,
    body: string,
    registrationToken: string,
    data: NotificationData = {}
  ): Promise<void> {
    if (!data.summary) data.summary = body;

    const message: admin.messaging.Message = {
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            badge: 1,
            sound: 'default'
          }
        },
        fcmOptions: {
            imageUrl: Bun.env.LOGO_ICON_PATH
        }
      },
      data,
      token: registrationToken
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent iOS push message:', response);
    } catch (error) {
      console.log('Error sending iOS message:', error);
      throw error;
    }
  }
}

// Device types
type DeviceType = 'web' | 'android' | 'ios';

// Main Push Notification Service
class PushNotificationService {
  private device: DeviceInterface;

  constructor(deviceType: DeviceType) {
    switch (deviceType) {
      case 'web':
        this.device = new WebPushNotification();
        break;
      case 'android':
        this.device = new AndroidPushNotification();
        break;
      case 'ios':
        this.device = new IOSPushNotification();
        break;
      default:
        throw new Error('Unsupported device type');
    }
  }

  async sendPushNotification(
    title: string,
    body: string,
    registrationToken: string,
    data: NotificationData = {}
  ): Promise<void> {
    await this.device.sendPushNotification(title, body, registrationToken, data);
  }
}

export { PushNotificationService, DeviceType, NotificationData };