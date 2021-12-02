import { CertMonitor } from "../";

// Create the certificate monitor
const certMonitor = new CertMonitor.NginxCertMonitorFactory().create(false);

// Initial domains
certMonitor.set({
    'mydomain.com': 'me@myemail.com',
});

// Start monitoring
certMonitor.start(1440);