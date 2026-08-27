require('dotenv').config();
const mqtt = require('mqtt');
const pino = require('pino');

const logger = pino({
  transport: { target: 'pino-pretty' },
  level: process.env.LOG_LEVEL || 'info',
});

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const CLIENT_ID = `ingestion_service_${Math.random().toString(16).substr(2, 8)}`;

logger.info('Initializing Enterprise Telemetry Ingestion Service...');

const client = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: false, // Ensures we don't miss messages if service restarts (requires QoS > 0)
  reconnectPeriod: 3000,
  connectTimeout: 5000,
});

client.on('connect', () => {
  logger.info(`Connected to MQTT Broker at ${BROKER_URL}`);
  
  // Subscribe to all machine metrics with QoS 1
  client.subscribe('telemetry/+/+/metrics', { qos: 1 }, (err, granted) => {
    if (err) {
      logger.error(`Subscription error: ${err.message}`);
    } else {
      logger.info(`Subscribed successfully: ${JSON.stringify(granted)}`);
    }
  });

  // Subscribe to sensor status updates
  client.subscribe('telemetry/status/+', { qos: 1 });
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    
    if (topic.includes('/status/')) {
      logger.warn(`Sensor Status Alert: ${payload.status} (Topic: ${topic})`);
    } else {
      // Process telemetry
      if (payload.temperature > 75) {
        logger.error(`🚨 CRITICAL TEMPERATURE DETECTED! Sensor: ${payload.sensorId}, Temp: ${payload.temperature}°C`);
        // In a real system, you would trigger an alert/webhook here.
      } else {
        logger.info(`Processed reading from ${payload.sensorId} | Temp: ${payload.temperature}°C | Vib: ${payload.vibration} mm/s`);
      }
    }
  } catch (e) {
    logger.error(`Failed to parse message on topic ${topic}: ${e.message}`);
  }
});

client.on('reconnect', () => {
  logger.warn('Reconnecting to MQTT broker...');
});

client.on('error', (err) => {
  logger.fatal(`Connection error: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down ingestion service...');
  client.end(false, () => {
    logger.info('Disconnected gracefully.');
    process.exit(0);
  });
});
