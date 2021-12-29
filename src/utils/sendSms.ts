import * as dotenv from "dotenv";
import { createSMSModule, sipgateIO } from "sipgateio";
dotenv.config();

export const sendSmsPin = (
  personalAccessTokenId: string,
  personalAccessToken: string,
  to: string,
  pin: number,
  smsId: string,
) => {
  const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
  });

  const message = `Your Pin is: ${pin}`;

  const shortMessage = {
    message,
    to,
    smsId,
  };
  const sms = createSMSModule(client);

  sms
    .send(shortMessage)
    .then(() => {
      console.log(`Sms sent to ${to}`);
    })
    .catch(console.error);
};
