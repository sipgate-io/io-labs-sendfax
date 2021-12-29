import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createFaxModule, sipgateIO } from "sipgateio";
dotenv.config();

export const sendFaxPin = async (
  personalAccessTokenId: string,
  personalAccessToken: string,
  faxlineId: string,
  to: string,
): Promise<void> => {
  const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
  });

  const filePath = "./src/utils/testpage.pdf";
  const { name: filename } = path.parse(path.basename(filePath));
  const fileContent = fs.readFileSync(filePath);

  const fax = createFaxModule(client);

  const faxSendResponsePromise = fax.send({
    fileContent,
    filename,
    to,
    faxlineId,
  });

  faxSendResponsePromise
    .then((sendFaxResponse) => {
      console.log(`Fax sent with id: ${sendFaxResponse.sessionId}`);
      const faxStatusPromise = fax.getFaxStatus(sendFaxResponse.sessionId);
      faxStatusPromise
        .then((faxStatus) => {
          console.log(`Fax status: ${faxStatus}`);
        })
        .catch((error) => {
          console.error("Fax status could not be retrieved: ", error);
        });
    })
    .catch((error) => {
      console.error("Fax could not be sent with Error: ", error);
    });
};
