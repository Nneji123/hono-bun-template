import { EmailNotificationService } from '../src/services/email.service'; // Adjust path if needed

async function main() {
  try {
    const emailService = new EmailNotificationService();

    await emailService.sendEmail(
      'Test Email',
      'server-error', // Ensure this exists or change to an actual template
      'ifeanyinneji777@gmail.com',
      { name: 'John Doe' }, // Template variables
      [] // No attachments
    );

    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

main();
