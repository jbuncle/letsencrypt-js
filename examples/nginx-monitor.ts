import { NginxCertMonitorFactory } from "../";

// Create the certificate monitor
const certMonitor = new NginxCertMonitorFactory().create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start monitoring
certMonitor.start(1440);