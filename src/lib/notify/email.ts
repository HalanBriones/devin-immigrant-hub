export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.info(`[email] to=${message.to} subject=${message.subject}\n${message.body}`);
  }
}

export const emailSender: EmailSender = new ConsoleEmailSender();
