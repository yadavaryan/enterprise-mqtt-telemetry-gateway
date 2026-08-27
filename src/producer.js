require('dotenv').config();
const mqtt = require('mqtt');
const pino = require('pino');

const logger = pino({
  transport: { target: 'pino-pretty' },
  level: process.env.LOG_LEVEL || 'info',
});

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const FLEET_SIZE = parseInt(process.env.FLEET_SIZE, 10) || 5;

// Simulate an industrial IoT sensor fleet
class SensorNode {
  constructor(id, brokerUrl) {
    this.id = `sensor_${id}`;
    this.topic = `telemetry/factory_1/machine_${id}/metrics`;
    
    // Connect with QoS settings and Will message
    this.client = mqtt.connect(brokerUrl, {
      clientId: `client_${this.id}_${Math.random().toString(16).substr(2, 8)}`,
      clean: false, // Persistent session
      reconnectPeriod: 5000,
      will: {
        topic: `telemetry/status/${this.id}`,
        payload: Buffer.from(JSON.stringify({ status: 'offline', timestamp: Date.now() })),
        qos: 1,
        retain: true,
      },
    });

    this.init();
  }

  init() {
    this.client.on('connect', () => {
      logger.info(`[${this.id}] Connected to broker.`);
      // Publish online status
      this.client.publish(`telemetry/status/${this.id}`, JSON.stringify({ status: 'online', timestamp: Date.now() }), { retain: true, qos: 1 });
      this.startEmitting();
    });

    this.client.on('error', (err) => logger.error(`[${this.id}] Error: ${err.message}`));
    this.client.on('offline', () => logger.warn(`[${this.id}] Went offline.`));
  }

  startEmitting() {
    setInterval(() => {
      if (!this.client.connected) return;

      const payload = {
        sensorId: this.id,
        temperature: (Math.random() * 20 + 60).toFixed(2), // 60-80 C
        vibration: (Math.random() * 5).toFixed(2), // 0-5 mm/s
        timestamp: new Date().toISOString(),
      };

      // Publish with QoS 1 (At least once delivery)
      this.client.publish(this.topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
          logger.error(`[${this.id}] Publish failed: ${err.message}`);
        } else {
          logger.debug(`[${this.id}] Published telemetry data.`);
        }
      });
    }, 2000 + Math.random() * 1000); // Stagger emissions
  }
}

logger.info(`Starting producer fleet simulation with ${FLEET_SIZE} sensors...`);
const fleet = [];
for (let i = 1; i <= FLEET_SIZE; i++) {
  fleet.push(new SensorNode(i, BROKER_URL));
}
