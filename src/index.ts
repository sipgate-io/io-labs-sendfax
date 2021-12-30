import * as dotenv from "dotenv";
import "reflect-metadata";
import { createWebhookModule, WebhookResponse } from "sipgateio";
import {
  createConnection as createDatabaseConnection,
  getRepository as getDatabaseRepository,
} from "typeorm";

import Customer from "./entities/Customer";
import { sendFaxPin } from "./utils/sendFax";
import { sendSmsPin } from "./utils/sendSms";

enum Status {
  CUSTOMER_ID_INPUT,
  PIN_SENT,
  PIN_INPUT,
  FAX_SENT,
  INVALID_ID,
  INVALID_AUTH,
}

type FaxMetaData = {
  faxStatus: Status;
  recipient: string;
  customerId: string;
};

dotenv.config();

const CUSTOMERID_DTMF_INPUT_LENGTH = 8;
const PIN_DTMF_INPUT_LENGTH = 5;

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

if (!process.env.SIPGATE_TOKEN_ID) {
  console.error("ERROR: You need to set a token_id to receive a sms!\n");
  process.exit();
}

if (!process.env.SIPGATE_TOKEN) {
  console.error("ERROR: You need to set a token to receive a sms!\n");
  process.exit();
}

if (!process.env.SIPGATE_SMS_EXTENSION) {
  console.error("ERROR: You need to set a sms extension to receive a sms!\n");
  process.exit();
}

if (!process.env.SIPGATE_FAX_EXTENSION) {
  console.error("ERROR: You need to set a fax_extension to receive a sms!\n");
  process.exit();
}

if (!process.env.SIPGATE_FAX_RECIPIENT) {
  console.error("ERROR: You need to set a fax_recipient to receive a sms!\n");
  process.exit();
}

const personalAccessTokenId = process.env.SIPGATE_TOKEN_ID || "";
const personalAccessToken = process.env.SIPGATE_TOKEN || "";
const smsExtension = process.env.SIPGATE_SMS_EXTENSION || "";
const faxlineId = process.env.SIPGATE_FAX_EXTENSION || "";
const to = process.env.SIPGATE_FAX_RECIPIENT || "";

const SERVER_ADDRESS = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
const PORT = process.env.SIPGATE_WEBHOOK_SERVER_PORT;

const getAnnouncementByOrderStatus = (sendFaxStatus: Status | null): string => {
  switch (sendFaxStatus) {
    case Status.CUSTOMER_ID_INPUT:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/request_customerid.wav?raw=true";
    case Status.PIN_SENT:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/pin_sent.wav?raw=true";
    case Status.PIN_INPUT:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/request_customerid.wav?raw=true";
    case Status.FAX_SENT:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/fax_sent.wav?raw=true";
    case Status.INVALID_ID:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/invalid_id.wav?raw=true";
    case Status.INVALID_AUTH:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/auth_error.wav?raw=true";
    default:
      return "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/error.wav?raw=true";
  }
};

const getAnnouncementByCustomerId = async (
  customerId: string,
  status: Status,
  recipient: string,
): Promise<string> => {
  const customer = await getDatabaseRepository(Customer).findOne(customerId);
  if (!customer) {
    console.log(`Customer with Id: ${customerId} not found...`);
    return getAnnouncementByOrderStatus(null);
  }
  sendSmsPin(
    personalAccessTokenId,
    personalAccessToken,
    recipient,
    customer.pin,
    smsExtension,
  );
  return getAnnouncementByOrderStatus(status);
};

const getAnnouncmentByCustomerPIN = async (
  customerId: string,
  pin: string,
  status: Status,
): Promise<string> => {
  const customer = await getDatabaseRepository(Customer).findOne(customerId);
  if (!customer) {
    console.log(`Customer with Id: ${customerId} not found...`);
    return getAnnouncementByOrderStatus(null);
  }
  if (customer.pin === Number(pin)) {
    sendFaxPin(personalAccessTokenId, personalAccessToken, faxlineId, to);
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
      const stage = new Map<string, FaxMetaData>();

      webhookServer.onNewCall((newCallEvent) => {
        console.log(`New call from ${newCallEvent.from} to ${newCallEvent.to}`);
        stage.set(newCallEvent.callId, {
          faxStatus: Status.CUSTOMER_ID_INPUT,
          recipient: newCallEvent.from,
          customerId: "",
        });

        return WebhookResponse.gatherDTMF({
          maxDigits: CUSTOMERID_DTMF_INPUT_LENGTH,
          timeout: 5000,
          announcement:
            "https://github.com/sipgate-io/io-labs-sendfax/blob/main/static/request_customerid.wav?raw=true",
        });
      });

      webhookServer.onData(async (dataEvent) => {
        const customerInput = dataEvent.dtmf;
        const callerId = dataEvent.callId;

        let FaxMetaData: FaxMetaData = <FaxMetaData>stage.get(callerId);
        let faxStatus: Status = FaxMetaData.faxStatus;
        let recipient: string = FaxMetaData.recipient;
        let customerId: string = FaxMetaData.customerId;

        if (
          customerInput.length === CUSTOMERID_DTMF_INPUT_LENGTH &&
          faxStatus === Status.CUSTOMER_ID_INPUT
        ) {
          console.log(`The caller provided a customer id: ${customerInput} `);
          stage.set(callerId, {
            faxStatus: Status.PIN_SENT,
            recipient: recipient,
            customerId: customerInput,
          });

          return WebhookResponse.gatherDTMF({
            maxDigits: PIN_DTMF_INPUT_LENGTH,
            timeout: 5000,
            announcement: await getAnnouncementByCustomerId(
              customerInput,
              Status.PIN_INPUT,
              recipient,
            ),
          });
        }

        if (
          customerInput.length === PIN_DTMF_INPUT_LENGTH &&
          faxStatus === Status.PIN_SENT
        ) {
          console.log(`The caller provided a pin: ${customerInput} `);
          stage.set(callerId, {
            faxStatus: Status.FAX_SENT,
            recipient: recipient,
            customerId: customerId,
          });

          return WebhookResponse.gatherDTMF({
            maxDigits: 1,
            timeout: 0,
            announcement: await getAnnouncmentByCustomerPIN(
              customerId,
              customerInput,
              Status.FAX_SENT,
            ),
          });
        }

        return WebhookResponse.hangUpCall();
      });
    });
});
