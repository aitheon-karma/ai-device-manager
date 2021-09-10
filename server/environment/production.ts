export const environment = {
  production: true,
  mailer: {
    host: 'ai-mail.ai-mail.svc.cluster.local',
    port: '25',
    from: process.env.MAILER_FROM || '"Aitheon" <no-reply@aitheon.com>',
    auth: {
      user: process.env.MAILER_EMAIL_ID || 'testuser',
      pass: process.env.MAILER_PASSWORD || '9j8js7pi37a4'
    },
    tls: {
      rejectUnauthorized: false
    }
  },
  deviceTokenSecret: process.env.DEVICE_TOKEN_SECRET || '8svpda2a5Jz425hnu9EDKWSLPRYUgf',
  authURI: `http://ai-auth.ai-auth.svc.cluster.local:${ process.env.AI_AUTH_SERVICE_PORT || 3000 }`,
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || `amqp://ai-rabbit:Ne&ZTeFeYCqqQRK3s7qF@ai-rabbitmq.ai-rabbitmq.svc.cluster.local:5672`
  },
  webSocket: {
    maxReceivedMessageSize: process.env.WS_MAX_RECEIVED_MESSAGE_SIZE || 512000 * 1000, // 512Mb
    maxReceivedFrameSize: process.env.WS_MAX_RECEIVED_FRAME_SIZZ || 512000, // 512Kb
    fragmentationThreshold: process.env.WS_FRAGMENTATION_THRESHOLD || 512000, // 512Kb
    disableNagleAlgorithm: process.env.DISABLE_NAGLE_ALGORITHM === 'false' ? false : true
  }
};
