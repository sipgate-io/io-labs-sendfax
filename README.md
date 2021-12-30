# io-labs-sendfax

In this example project, we will create an application that sends a fax after a successful authentication via an SMS pin code.
The application answers a phone call with a request to input a valid customer ID via DTMF.
If a valid ID is entered, an SMS containing a pin will be sent to the telephonenumber that is linked to said customer ID. Once the customer enters the provided pin, an exemplary PDF-Document will be send as a fax.

## What is sipgate.io?

sipgate.io is a collection of APIs, which enables sipgate's customers to build flexible integrations matching their individual needs. It provides interfaces for sending and receiving text messages or faxes, monitoring the call history, and initiating and manipulating calls. In this tutorial, we will use sipgate.io's Push and REST APIs for automatically responding to calls and initiating callbacks after a specified time.

## In this example

The script in this project sets up a simple web server running on your local machine. If someone tries to reach your sipgate number, this web server will answer the call and play a sound file that prompts the user to input a valid customer ID. Based on the customer ID a voicemessage is played, a Pin is fetched from the database and is returned as a Pin to the user via SMS. If the user enters said pin correctly as DTMF, a sample fax is sent.
Our application consists of five phases:

1. The application answers a call with a voicemessage that prompts the customer to input a valid customer ID.
2. After a valid input is given, the customer data is fetched from the mysql database.
3. If the customerid exists, a voicemessage is played and an SMS containing the pin is sent to the customer.
4. The customer sends the pin back to the service, to confirm the customers identity.
5. If the correct pin is entered, the fax will be send to the recipient specified in the configuration.

### Prerequisites:

- [node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)

## Setup

To launch this example, navigate to a directory where you want the example service to be stored. In your terminal, clone this repository from GitHub and install the required dependencies using `npm install`.

```
git clone https://github.com/sipgate-io/io-labs-telephone-status-request.git
cd io-labs-telephone-status-request
npm install
```

## Environment Variables

To run the project on your local machine, several environment variables must be set:

1. In the terminal, run `ssh -R 80:localhost:8080 nokey@localhost.run`
2. The output consists of several lines. Copy the last URL printed.
3. In your IDE, duplicate _.env.example_ and rename the file to _.env_
4. Paste the URL from step 2 in `SIPGATE_WEBHOOK_SERVER_ADDRESS`. The `SIPGATE_WEBHOOK_SERVER_ADDRESS` variable in your _.env_ should look similar to this:

```
SIPGATE_WEBHOOK_SERVER_ADDRESS=https://d4a3f97e7ccbf2.localhost.run
SIPGATE_WEBHOOK_SERVER_PORT=8080
```

5. In your .env file you should set: `DATABASE_USER`, `DATABASE_PASSWORD` and `DATABASE_ROOT_PASSWORD` to values of your choice.
6. Go to your [sipgate app-web account](https://console.sipgate.com/webhooks/urls) and set both the incoming and outgoing webhook URLs as the URL from step 2.
7. The service also needs a valid Token for it to send SMS.
   Navigate to your [personal access token settings](https://app.sipgate.com/w0/personal-access-token) and create a token that has the `sessions:sms:write`, `sessions:fax:write` and `history:read` scopes. (Or, alternatively, create a token that has all scopes.)
   Copy the Token that is displayed and paste it into .env-variable `SIPGATE_TOKEN`.
   Close the dialogbox and copy the corresponding TokenID in the Personal-Access-Token-List into the .env-variable `SIPGATE_TOKEN_ID`.
8. Web SMS Extensions
   Set the .env-variable `SIPGATE_SMS_EXTENSION` to your SMS extension, for example `SIPGATE_SMS_EXTENSION=s1`

- A Web SMS extension consists of the letter 's' followed by a number (e.g. 's0'). The sipgate API uses the concept of Web SMS extensions to identify devices within your account that are enabled to send SMS. In this context the term 'device' does not necessarily refer to a hardware phone but rather a virtual connection.
  You can use the sipgate api to find out what your extension is. For example:
  curl \
  --user tokenId:token \
  https://api.sipgate.com/v2/{userId}/sms
  Replace tokenId and token with your sipgate credentials and userId with your sipgate user id.
  The user id consists of the letter 'w' followed by a number (e.g. 'w0'). It can be found as follows:
  Log into your sipgate account
  The URL of the page should have the form https://app.sipgate.com/{userId}/... where {userId} is your user id.

9. Fax Extensions
   Set the .env-variable `SIPGATE_FAX_EXTENSION` to your Fax extension, for example `SIPGATE_FAX_EXTENSION=f5`

- A Fax extension consists of the letter 'f' followed by a number (e.g. 'f0'). The sipgate API uses the concept of Fax extensions to identify devices within your account that are enabled to send Fax. In this context the term 'device' does not necessarily refer to a hardware Fax but rather a virtual representation.
  You can find out what your Fax extension is as follows:
  Log into your sipgate account
  Use the sidebar to navigate to the Routing (Telefonie) tab
  Click on any Fax device in your routing table
  Select any option (gear icon) to open the corresponding menu
  The URL of the page should have the form https://app.sipgate.com/w0/routing/dialog/{option}/{faxlineId} where {faxlineId} is your Fax extension.
  Set the .env-variable `SIPGATE_FAX_EXTENSION` to your Fax extension, for example `SIPGATE_FAX_EXTENSION=f5`

10. Set the .env-variable `SIPGATE_FAX_RECIPIENT` to the number of your fax-recipient. For testing purposes, your own sipgate-number can be used.
11. Open a seperate terminal in your project folder.
12. Launch the database with `docker-compose up -d`.
13. As soon as the docker container is running you can initiate the database with `npm run database:init`. This will create a local database, which can be inspected with tools such as Datagrip.
14. Run `npm start` from the root folder of this project.
    Now you can call your sipgate account number to test the application.
