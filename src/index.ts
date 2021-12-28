import * as dotenv from "dotenv";
import "reflect-metadata";
import { createWebhookModule, WebhookResponse } from "sipgateio";
import {
  createConnection as createDatabaseConnection,
  getRepository as getDatabaseRepository,
} from "typeorm";

import Customer, { OrderStatus } from "./entities/Customer";

dotenv.config();

const MAX_CUSTOMERID_DTMF_INPUT_LENGTH = 8;

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
  orderStatus: OrderStatus | null,
): string => {
  switch (orderStatus) {
    case OrderStatus.RECEIVED:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_received.wav?raw=true";
    case OrderStatus.PENDING:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_pending.wav?raw=true";
    case OrderStatus.FULLFILLED:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_fullfilled.wav?raw=true";
    case OrderStatus.CANCELED:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/orderstatus_canceled.wav?raw=true";
    default:
      return "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/error.wav?raw=true";
  }
};

const getAnnouncementByCustomerId = async (
  customerId: string,
): Promise<string> => {
  const customer = await getDatabaseRepository(Customer).findOne(customerId);
  if (!customer) {
    console.log(`Customer with Id: ${customerId} not found...`);
    return getAnnouncementByOrderStatus(null);
  }
  return getAnnouncementByOrderStatus(customer.orderStatus);
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
      webhookServer.onNewCall((newCallEvent) => {
        console.log(`New call from ${newCallEvent.from} to ${newCallEvent.to}`);
        return WebhookResponse.gatherDTMF({
          maxDigits: MAX_CUSTOMERID_DTMF_INPUT_LENGTH,
          timeout: 5000,
          announcement:
            "https://github.com/sipgate-io/io-labs-telephone-status-request/blob/main/static/request_customerid.wav?raw=true",
        });
      });

      webhookServer.onData(async (dataEvent) => {
        const customerId = dataEvent.dtmf;
        if (customerId.length === MAX_CUSTOMERID_DTMF_INPUT_LENGTH) {
          console.log(`The caller provided a customer id: ${customerId} `);

          return WebhookResponse.gatherDTMF({
            maxDigits: 1,
            timeout: 0,
            announcement: await getAnnouncementByCustomerId(customerId),
          });
        }
        return WebhookResponse.hangUpCall();
      });
    });
});
