import { BasicCertMonitorFactory, WebRootChallengeHandlerFactory } from "../dist";

// Web Root used to write and serve ACME challenge responses
const webRoot: string = '/usr/share/nginx/html';
// Create challenge handler
const challengeHandler = new WebRootChallengeHandlerFactory(webRoot).create();

// Create cert monitor instance with a factory
const certMonitor = new BasicCertMonitorFactory(
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
