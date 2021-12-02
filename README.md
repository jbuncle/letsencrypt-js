# LetEncrypt Certificate Generation & Monitoring Library

Simple NodeJS/TypeScript library for providing generating and/or monitoring LetsEncrypt (ACME) certificates (i.e. auto-renewal).

Provides the ability to dynamically define, monitor and generate certificates.

Built on top of acme-client.

## Certificate Generation

The example below shows how to generate a one-off certificate

```typescript

import type { AccountKeyProviderI } from "@jbuncle/letsencrypt-js";
import { CertGenerator, ChallengeHandler, Client } from "@jbuncle/letsencrypt-js";

// Create certificate handler

// WebRootChallengeHandlerFactory writes ACME challenges to the filesystem which are then served statically
const challengeHandler: ChallengeHandler.ChallengeHandlerI = new ChallengeHandler.WebRootChallengeHandlerFactory( '/usr/share/nginx/html').create();

// Define Account key provider/generator, to store and persist account keys use FileAccountKeyProvider
const accountKeyProvider: AccountKeyProviderI = new Client.AccountKeyProviderFactory().createAccountKeyProvider();

// Create a client factory
const clientFactory: Client.ClientFactoryI = new Client.ClientFactory(accountKeyProvider, false);

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

```

## Certificate Monitoring

### Simple Example

To generate and renew certificates as a background process you can use a certificate monitor.

```typescript
import { CertMonitor, ChallengeHandler } from "@jbuncle/letsencrypt-js";

// Web Root used to write and serve ACME challenge responses
const webRoot: string = '/usr/share/nginx/html';
// Create challenge handler
const challengeHandler = new ChallengeHandler.WebRootChallengeHandlerFactory(webRoot).create();

// Create cert monitor instance with a factory
const certMonitor = new CertMonitor.BasicCertMonitorFactory(
    [challengeHandler],
    `/etc/nginx/certs/%s.crt`, // Certificate file pattern
    `/etc/nginx/certs/%s.key`, // Key file pattern 
    `/etc/nginx/certs/%s.chain.pem`, // CA file Pattern
    `/etc/letsencrypt/accounts` // Account key path
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

The above example uses values that are compatible with typical Nginx configuration,
the equivalent would be needed for other web servers.

However, for convenience you can use an NginxCertMonitorFactory to create a CertMonitor with such values.

### Nginx Certificate Monitoring

Create CertMonitor using Nginx compatible defaults

```typescript
import { CertMonitor } from "@jbuncle/letsencrypt-js";

// Create the certificate monitor
const certMonitor = new CertMonitor.NginxCertMonitorFactory().create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start monitoring
certMonitor.start(1440);
```
