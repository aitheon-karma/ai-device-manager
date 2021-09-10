const path = require('path');
/**
 * App relative config. Can override any core config
 */
module.exports = {
  /**
   * Identify itself. Current MicroService Name and ID in Database
   */
  serviceId: 'DEVICE_MANAGER',
  /**
   * App running port
   */
  port: process.env.PORT || 3000,
  /**
   * App environment
   */
  environment: process.env.NODE_ENV || 'production',
  /**
   * Session temp folder
   */
  sessionsTempFolder: path.resolve(`./temp-sessions`),
  /**
   * 
   */
  sessionSaveInterval: 1 * 60 * 1000, // each 1 minute
  /**
   * 
   */
  sessionAliveTime: 15, // in minutes
  /**
   * AWS S3 Settings
   */
  aws_s3: {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AKIAJ4SOUDVXZNLMVWWA",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "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",
    },
    bucket: process.env.AWS_SECRET_ACCESS_KEY || "isabel-data"
  },
  deviceTokenSecret: process.env.DEVICE_TOKEN_SECRET || '8svpda2a5Jz425hnu9EDKWSLPRYUgf',
  webSocket: {
    maxReceivedMessageSize: process.env.WS_MAX_RECEIVED_MESSAGE_SIZE || 512000 * 1000, // 512Mb
    maxReceivedFrameSize: process.env.WS_MAX_RECEIVED_FRAME_SIZZ || 512000, // 512Kb
    fragmentationThreshold: process.env.WS_FRAGMENTATION_THRESHOLD || 512000, // 512Kb
    disableNagleAlgorithm: process.env.DISABLE_NAGLE_ALGORITHM === 'false' ? false : true
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || `amqp://ai-rabbit:Ne&ZTeFeYCqqQRK3s7qF@ai-rabbitmq.ai-rabbitmq.svc.cluster.local:5672`
  },
}