export type SmsMessage = {
  to: string;
  body: string;
};

export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}

class ConsoleSmsSender implements SmsSender {
  async send(message: SmsMessage): Promise<void> {
    console.info(`[sms] to=${message.to}\n${message.body}`);
  }
}

export const smsSender: SmsSender = new ConsoleSmsSender();
