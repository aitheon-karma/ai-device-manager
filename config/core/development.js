/**
 * Core config for all micro services
 */
module.exports = {
  web: {
    title: 'DEVELOPMENT - Isabel - FedoraLabs'
  },
  /**
   * SSL setting, to use http or https for links
   */
  secure: process.env.SECURE || false,
  /**
   * Domain used for cookies and etc.
   */
  domain: process.env.DOMAIN || 'isabel.localhost',
  /**
   * Database connection information
   */
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/isabel'
  },
  /**
   * Logger Setting
   */
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'dev',
    // https://github.com/winstonjs/winston
    // Winston logger options
    fileLogger: {
      level: 'silly',
      directoryPath: process.cwd() + '/logs/',
      fileName: 'app.log',
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  /**
   * Send mail config
   */
  mailer: {
    from: '"DEV Isabel - FedoraLabs" <no-reply@testingdomain.io>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  authURI: `https://dev.aitheon.com/auth`,
}