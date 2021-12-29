import * as dotenv from "dotenv";
import "reflect-metadata";
import { createWebhookModule, WebhookResponse } from "sipgateio";
import {
  createConnection as createDatabaseConnection,
  getRepository as getDatabaseRepository,
} from "typeorm";

import Customer from "./entities/Customer";

enum SendFaxStatus {
  CUSTOMER_ID_INPUT,
  PIN_SENT,
  PIN_INPUT,
  FAX_SENT,
  INVALID_ID,
  INVALID_AUTH,
}

dotenv.config();

const MAX_CUSTOMERID_DTMF_INPUT_LENGTH = 8;
const MAX_PIN_DTMF_INPUT_LENGTH = 5;

if (!process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS) {
  console.error(
    "ERROR: You need to set a server address to receive webhook events!\n",
  );
  process.exit();
}

if (!process.env.SIPGATE_WEBHOOK_SERVER_PORT) {
  console.error(
    "ERROR: You need to set a server port to receive webhook events!\n",
  );
  process.exit();
}

const SERVER_ADDRESS = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
const PORT = process.env.SIPGATE_WEBHOOK_SERVER_PORT;

const getAnnouncementByOrderStatus = (
  sendFaxStatus: SendFaxStatus | null,
): string => {
  switch (sendFaxStatus) {
    case SendFaxStatus.CUSTOMER_ID_INPUT: 
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/request_customerid.wav?raw=true";
    case SendFaxStatus.PIN_SENT:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/pin_sent.wav?raw=true";
    case SendFaxStatus.PIN_INPUT: 
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/request_customerid.wav?raw=true";
    case SendFaxStatus.FAX_SENT:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/fax_sent.wav?raw=true";
    case SendFaxStatus.INVALID_ID:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/invalid_id.wav?raw=true";
    case SendFaxStatus.INVALID_AUTH:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/auth_error.wav?raw=true";
    default:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/error.wav?raw=true";
  }
};

const getAnnouncementByCustomerId = async (
  customerId: string,
  status: SendFaxStatus,
): Promise<string> => {
  const customer = await getDatabaseRepository(Customer).findOne(customerId);
  if (!customer) {
    console.log(`Customer with Id: ${customerId} not found...`);
    return getAnnouncementByOrderStatus(null);
  }
  return getAnnouncementByOrderStatus(status);
};

const getAnnouncmentByCustomerPIN = async (
  customerId: string,
  pin: string,
  status: SendFaxStatus,
): Promise<string> => {
  const customer = await getDatabaseRepository(Customer).findOne(customerId);
  if (!customer) {
    console.log(`Customer with Id: ${customerId} not found...`);
    return getAnnouncementByOrderStatus(null);
  }
  if(customer.pin === Number(pin)){
    return getAnnouncementByOrderStatus(status);
  }
  return getAnnouncementByOrderStatus(null);
};

createDatabaseConnection().then(() => {
  console.log("Database connection established");
  createWebhookModule()
    .createServer({
      port: PORT,
      serverAddress: SERVER_ADDRESS,
    })
    .then((webhookServer) => {
      console.log("Ready for new calls...");
      const stage = new Map<string, SendFaxStatus>();

      webhookServer.onNewCall((newCallEvent) => {
        console.log(`New call from ${newCallEvent.from} to ${newCallEvent.to}`);
        stage.set(newCallEvent.callId, SendFaxStatus.CUSTOMER_ID_INPUT);

        return WebhookResponse.gatherDTMF({
          maxDigits: MAX_CUSTOMERID_DTMF_INPUT_LENGTH,
          timeout: 5000,
          announcement:
            "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/request_customerid.wav?raw=true",
        });
      });

      webhookServer.onData(async (dataEvent) => {
        const customerInput = dataEvent.dtmf;
        const callerId = dataEvent.callId;
        
        if (customerInput.length === MAX_CUSTOMERID_DTMF_INPUT_LENGTH && stage.get(callerId) === SendFaxStatus.CUSTOMER_ID_INPUT) {
          console.log(`The caller provided a customer id: ${customerInput} `);
          stage.set(callerId, SendFaxStatus.PIN_SENT);

          return WebhookResponse.gatherDTMF({
            maxDigits: MAX_PIN_DTMF_INPUT_LENGTH,
            timeout: 5000,
            announcement: await getAnnouncementByCustomerId(customerInput, SendFaxStatus.PIN_INPUT),
          });
        }

        if (customerInput.length === MAX_PIN_DTMF_INPUT_LENGTH && stage.get(callerId) === SendFaxStatus.PIN_SENT) {
          console.log(`The caller provided a pin: ${customerInput} `);
          stage.set(callerId, SendFaxStatus.FAX_SENT);

          return WebhookResponse.gatherDTMF({
            maxDigits: 1,
            timeout: 0,
            announcement: await getAnnouncmentByCustomerPIN(customerInput, customerInput, SendFaxStatus.PIN_SENT),
          });
        }

        return WebhookResponse.hangUpCall();
      });
    });
});
