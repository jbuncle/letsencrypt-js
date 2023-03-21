# LetEncrypt Certificate Generation & Monitoring Library

This is a NodeJS/TypeScript library that simplifies the process of generating and monitoring LetEncrypt (ACME) certificates. It provides the ability to dynamically define, monitor and generate certificates using the acme-client library.

## Certificate Generation

The library allows you to generate a one-off certificate using the following example:

```typescript
import { AccountKeyProviderFactory, AccountKeyProviderI, CertGeneratorFactory, CertGeneratorI, ChallengeHandlerI, ClientFactory, ClientFactoryI, WebRootChallengeHandlerFactory } from "@jbuncle/letsencrypt-js";

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
```

## Certificate Monitoring

To generate and renew certificates as a background process, you can use a certificate monitor. The library provides a `BasicCertMonitor` class that you can use to monitor certificates. Here's an example of how to use it:

```typescript
import { BasicCertMonitorFactory, WebRootChallengeHandlerFactory } from "@jbuncle/letsencrypt-js";

// Web Root used to write and serve ACME challenge responses
const webRoot: string = '/usr/share/nginx/html';
// Create challenge handler
const challengeHandler = new WebRootChallengeHandlerFactory(webRoot).create();

// Create cert monitor instance with a factory
const certMonitor = new BasicCertMonitorFactory({
    handlers: [challengeHandler],
    certFilePathFormat: `/etc/nginx/certs/%s.crt`, // Certificate file pattern
    keyFilePathFormat: `/etc/nginx/certs/%s.key`, // Key file pattern 
    caFilePathFormat: `/etc/nginx/certs/%s.chain.pem`, // CA file Pattern
    accountKeyDir: `/etc/letsencrypt/accounts`, // Account key keyPath
    termsOfServiceAgreed: true,
}
).create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start the cert monitor telling it how long to wait between checks (in minutes)
certMonitor.start(1440);

// Update list of domains we're monitoring
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
    'myotherdomain.com': 'me@myemail.com',
});

```

Alternatively, you can use the `NginxCertMonitorFactory` to create a certificate monitor with Nginx-compatible defaults:

```typescript
// Create the certificate monitor
const termsOfServiceAgreed: boolean = true;
const certMonitor = new NginxCertMonitorFactory(termsOfServiceAgreed).create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start monitoring
certMonitor.start(1440);
```

Note that the above example is specific to Nginx, and an equivalent configuration is needed for other web servers.

## Node.js?

As this library was written in TypeScript it is compatible with plain Node.js

Here's an example:

```javascript
const { NginxCertMonitorFactory } = require("@jbuncle/letsencrypt-js");

// Create the certificate monitor
const certMonitor = new NginxCertMonitorFactory().create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start monitoring
certMonitor.start(1440);
```
