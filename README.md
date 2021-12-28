# io-labs-telephone-status-request

In this example project, we will create an application that answers phone calls and asks the user for a valid customerid to get the order status.

## What is sipgate.io?

sipgate.io is a collection of APIs, which enables sipgate's customers to build flexible integrations matching their individual needs. It provides interfaces for sending and receiving text messages or faxes, monitoring the call history, and initiating and manipulating calls. In this tutorial, we will use sipgate.io's Push and REST APIs for automatically responding to calls and initiating callbacks after a specified time.

## In this example

The script in this project sets up a simple web server running on your local machine. If someone tries to reach your sipgate number, this web server will answer the call and play a sound file that announces that the user should input a valid customerid. Based on the customerid a voicemessage is played, a status is fetched from the database and is returend as voicemessage to the user.

Our application consists of three phases:

1. The application answers a call with a voicemessage that announces that the customer should input a valid customerid.
2. After a valid input is given, the customer data are fetched from the mysql database.
3. If the customerid exists, a voicemessage is played based on the order status.

### Prerequisites:

- [node.js](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)

## Getting started

To launch this example, navigate to a directory where you want the example service to be stored. In your terminal, clone this repository from GitHub and install the required dependencies using `npm install`.

```
git clone https://github.com/sipgate-io/io-labs-telephone-status-request.git
cd io-labs-telephone-status-request
npm install
```

## Execution

To run the project on your local machine, follow these steps:

1. In the terminal, run `ssh -R 80:localhost:8080 nokey@localhost.run`
2. There will be some output. Copy the last URL.
3. Duplicate _.env.example_ and rename the file to _.env_
4. Paste the URL from step 2 in `SIPGATE_WEBHOOK_SERVER_ADDRESS`. Your _.env_ should look similar to this:

```
SIPGATE_WEBHOOK_SERVER_ADDRESS=https://d4a3f97e7ccbf2.localhost.run
SIPGATE_WEBHOOK_SERVER_PORT=8080
```

5. In your .env file you should set: `DATABASE_USER`, `DATABASE_PASSWORD` and `DATABASE_ROOT_PASSWORD` with an input of your choice.
6. Go to your [sipgate app-web account](https://console.sipgate.com/webhooks/urls) and set both the incoming and outgoing webhook URLs as the URL from step 2.
7. Launch the database with `docker-compose up -d`.
8. As soon as the docker container is running you can initiate the database with `npm run database:init`.
9. Run `npm start` from the root folder of this project.

Now you can call your sipgate account number to test the application.
If the call is successfully transmitted, your terminal will log some information.
