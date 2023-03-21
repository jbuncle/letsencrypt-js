


import { AccountKeyProviderFactory, AccountKeyProviderI, CertGeneratorFactory, CertGeneratorI, ChallengeHandlerI, ClientFactory, ClientFactoryI, WebRootChallengeHandlerFactory } from "../";

// Create certificate handler using WebRootChallengeHandlerFactory writes ACME challenges to the filesystem which are then served statically
const challengeHandler: ChallengeHandlerI
    = new WebRootChallengeHandlerFactory('/usr/share/nginx/html').create();

// Define Account key provider/generator, to store and persist account keys use FileAccountKeyProvider
const accountKeyProvider: AccountKeyProviderI
    = new AccountKeyProviderFactory().createAccountKeyProvider();

// Create a client factory
const clientFactory: ClientFactoryI
    = new ClientFactory(accountKeyProvider, false);

// Create certificate generator
const certGenerator: CertGeneratorI
    = new CertGeneratorFactory(clientFactory, challengeHandler, { termsOfServiceAgreed: true }).create();

// Generate certificate for domain, returning the result in a Promise
certGenerator.generate(
    { 'commonName': 'mydomain.com', }, // CSR Options
    'me@myemail.com' // LetsEncrypt email address
).then((certResult) => {
    console.log(certResult.caCert);
    console.log(certResult.privateKey);
    console.log(certResult.certificate);
});

