import { NginxCertMonitorFactory } from "../";

// Create the certificate monitor
const termsOfServiceAgreed: boolean = true;
const certMonitor = new NginxCertMonitorFactory(termsOfServiceAgreed).create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start monitoring
certMonitor.start(1440);