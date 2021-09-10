/**
 * Core config for all micro services
 */
module.exports = {
  web: {
    title: 'Isabel - FedoraLabs'
  },
  /**
   * SSL setting, to use http or https for links
   */
  secure: process.env.SECURE || false,
  /**
   * Domain used for cookies and etc.
   */
  domain: process.env.DOMAIN || 'testingdomain.io',
  /**
   * Database connection information
   */
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/isabel'
  },
  /**
   * Logger setting
   */
  log: {
    // TODO: addd logger for all and change this config
    format: process.env.LOG_FORMAT || 'combined',
    fileLogger: {
      level: 'debug',
      directoryPath: process.env.LOG_DIR_PATH || (process.cwd() + '/logs/'),
      fileName: process.env.LOG_FILE || 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  /**
   * Send mail config
   */
  mailer: {
    from: '"Isabel - FedoraLabs" <no-reply@testingdomain.io>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  authURI: `http://ai-auth.ai-auth.svc.cluster.local:${process.env.AI_AUTH_SERVICE_PORT || 3000}`,
}