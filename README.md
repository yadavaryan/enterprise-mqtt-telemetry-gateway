# 🏭 Enterprise MQTT Telemetry Gateway

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MQTT](https://img.shields.io/badge/MQTT-v5.0-blue?style=for-the-badge)](https://mqtt.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**A production-grade, event-driven IoT architecture demonstrating resilient telemetry ingestion using MQTT QoS, persistent sessions, and Last Will and Testament (LWT).**

</div>

---

## 📖 Overview

The **Enterprise MQTT Telemetry Gateway** provides a robust blueprint for handling high-throughput telemetry data from distributed IoT devices (e.g., factory sensors, fleet vehicles). Unlike basic publisher/subscriber examples, this project implements enterprise-critical features such as **Quality of Service (QoS 1)**, **Persistent Sessions** (ensuring no data loss during service restarts), and **Last Will and Testament (LWT)** for real-time device health monitoring.

This project showcases an advanced understanding of message broker configurations, resilient microservice design, and asynchronous stream processing using Node.js and Eclipse Mosquitto.

## ✨ Features

- **🌐 Eclipse Mosquitto Broker**: Containerized broker setup with persistent volume mapping and robust configuration for production deployment.
- **📡 Fleet Simulation (Producer)**: A Node.js module that dynamically generates a fleet of sensor nodes emitting simulated industrial metrics (temperature, vibration).
- **🛡️ Quality of Service (QoS 1)**: Guarantees "at least once" delivery for all critical telemetry, ensuring zero data loss across flaky network boundaries.
- **👻 Last Will and Testament (LWT)**: Instantly detects when a sensor node ungracefully disconnects and alerts the ingestion pipeline.
- **🚨 Real-Time Ingestion (Consumer)**: A centralized processing service utilizing `pino` for high-performance, structured logging, pattern-matched subscriptions, and threshold-based anomaly detection.

## 🏗️ Architecture

1. **IoT Fleet (Producers)**: Multiple clients connect. Upon connection, they register a "Will" message. They emit data staggering periodically.
2. **Message Broker**: Eclipse Mosquitto routes packets based on hierarchical topic structures (e.g., `telemetry/factory_1/machine_2/metrics`).
3. **Ingestion Service (Consumer)**: Subscribes using wildcard routing (`telemetry/+/+/metrics`). Maintains a persistent session (`clean: false`) so if it crashes, the broker queues the messages until it restarts.

## 🚀 Quick Start

### 1. Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+)

### 2. Infrastructure Setup (Broker)

Spin up the Mosquitto MQTT broker using Docker Compose:

```bash
docker-compose up -d
```
*The broker will listen on `localhost:1883`.*

### 3. Application Setup

Install the Node.js dependencies:

```bash
npm install
```

### 4. Run the Pipeline

Open two terminal windows to observe the asynchronous event flow.

**Terminal 1: Start the Ingestion Service (Consumer)**
```bash
npm run start:consumer
```
*This service will connect to the broker, establish a persistent session, and begin listening for anomalies.*

**Terminal 2: Start the Sensor Fleet (Producer)**
```bash
npm run start:producer
```
*You will immediately see telemetry streaming in Terminal 1. If a simulated machine exceeds the temperature threshold (75°C), the ingestion service will flag a critical alert.*

### 5. Testing Resilience (LWT & Persistence)

1. **Test LWT**: Kill the Producer script (`Ctrl+C`). Observe Terminal 1 immediately log an `offline` status alert via the MQTT Last Will protocol.
2. **Test Persistence**: Kill the Consumer script. Let the Producer run for 10 seconds. Restart the Consumer script. Observe the Consumer instantly process the backlog of messages queued by the broker during its downtime.

## 🔒 Production Considerations

Before deploying to a public environment, ensure the following modifications are made in `config/mosquitto.conf`:
- Set `allow_anonymous false`.
- Configure `password_file` or integrate with an external authentication plugin (e.g., LDAP/OAuth).
- Expose port `8883` and attach SSL/TLS certificates for encrypted transport.

## 📜 License

This project is licensed under the MIT License.
