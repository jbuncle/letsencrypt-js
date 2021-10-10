# LetEncrypt Certificate Generation & Monitoring Library

Simple NodeJS/TypeScript library for providing LetsEncrypt certificate monitoring (i.e. auto-renewal).

Provides the ability to dynamically define, monitor and generate certificates.

Built on top of acme-client.

## Certificate Generation

```javascript
// Create certificate monitor
const challengeHandler = new HandlerFactories.WebRootChallengeHandlerFactory().create(
    '/usr/share/nginx/html', // Web root used to write and serve ACME challenge responses
);
// Account key provider/generator
const accountKeyProvider = new AccountKeyGenerator(); // To store account keys use FileAccountKeyProvider
const clientFactory = new ClientFactory(accountKeyProvider, false);

const certGenerator: CertGenerator = new CertGenerator(clientFactory, challengeHandler);

certGenerator.generate(
    {'commonName' : 'mydomain.com',}, // CSR Options
    'me@myemail.com' // LetsEncrypt email address
).then((certResult)=>{
    console.log(certResult.caCert);
    console.log(certResult.privateKey);
    console.log(certResult.certificate);
});


```

## Certificate Monitoring

### Simple Example

```javascript
// Create certificate monitor
const challengeHandler = new HandlerFactories.WebRootChallengeHandlerFactory().create(
    '/usr/share/nginx/html', // Web Root used to write and serve ACME challenge responses
);

const certMonitor = new CertMonitorFactories.BasicCertMonitorFactory(
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

// Update domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
    'myotherdomain.com': 'me@myemail.com',
});

```

The above example uses value compatible with Nginx.
However you can use an NginxCertMonitorFactory to create a CertMonitor with such values.

### Nginx Certificate Monitoring

Create CertMonitor using Nginx compatible defaults

```javascript
const certMonitor = new CertMonitorFactories.NginxCertMonitorFactory().create(false);
certMonitor.start(1440);
```
