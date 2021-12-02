


import type { AccountKeyProviderI } from "../";
import { CertGenerator, ChallengeHandler, Client } from "../";

// Create certificate handler using WebRootChallengeHandlerFactory writes ACME challenges to the filesystem which are then served statically
const challengeHandler: ChallengeHandler.ChallengeHandlerI
    = new ChallengeHandler.WebRootChallengeHandlerFactory('/usr/share/nginx/html').create();

// Define Account key provider/generator, to store and persist account keys use FileAccountKeyProvider
const accountKeyProvider: AccountKeyProviderI
    = new Client.AccountKeyProviderFactory().createAccountKeyProvider();

// Create a client factory
const clientFactory: Client.ClientFactoryI
    = new Client.ClientFactory(accountKeyProvider, false);

// Create certificate generator
const certGenerator: CertGenerator.CertGeneratorI
    = new CertGenerator.CertGeneratorFactory(clientFactory, challengeHandler).create();

// Generate certificate for domain, returning the result in a Promise
certGenerator.generate(
    { 'commonName': 'mydomain.com', }, // CSR Options
    'me@myemail.com' // LetsEncrypt email address
).then((certResult) => {
    console.log(certResult.caCert);
    console.log(certResult.privateKey);
    console.log(certResult.certificate);
});

