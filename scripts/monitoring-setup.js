#!/usr/bin/env node

/**
 * 📊 Script de Configuração de Monitoramento
 * Configura monitoramento completo para produção
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Configurando sistema de monitoramento...');

// 1. Configurar Prometheus
const prometheusConfig = `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'rootgames-api'
    static_configs:
      - targets: ['localhost:1337']
    metrics_path: '/api/metrics'
    scrape_interval: 5s
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
      
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
`;

fs.writeFileSync('monitoring/prometheus.yml', prometheusConfig);

// 2. Configurar Grafana Dashboard
const grafanaDashboard = {
  "dashboard": {
    "id": null,
    "title": "RootGames API - Production Dashboard",
    "tags": ["rootgames", "api", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors/sec"
          }
        ]
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes",
            "legendFormat": "Memory Usage"
          }
        ]
      },
      {
        "id": 5,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(process_cpu_seconds_total[5m])",
            "legendFormat": "CPU Usage"
          }
        ]
      },
      {
        "id": 6,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
};

fs.writeFileSync('monitoring/grafana-dashboard.json', JSON.stringify(grafanaDashboard, null, 2));

// 3. Configurar Alertas
const alertRules = `
groups:
  - name: rootgames-api
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
          
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 1000000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value }} bytes"
          
      - alert: DatabaseDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database is not responding"
`;

fs.writeFileSync('monitoring/rules/rootgames-api.yml', alertRules);

// 4. Configurar Docker Compose para Monitoramento
const dockerCompose = `
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: rootgames-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/rules:/etc/prometheus/rules
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: rootgames-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./monitoring/grafana-dashboard.json:/var/lib/grafana/dashboards/rootgames.json
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: rootgames-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: rootgames-postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://rootgames:rootgames123@postgres:5432/rootgames?sslmode=disable
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: rootgames-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  grafana-storage:
`;

fs.writeFileSync('monitoring/docker-compose.yml', dockerCompose);

// 5. Configurar Alertmanager
const alertmanagerConfig = `
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@rootgames.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/'
`;

fs.writeFileSync('monitoring/alertmanager.yml', alertmanagerConfig);

// 6. Configurar Health Check
const healthCheckScript = `
#!/bin/bash

# Health Check Script para RootGames API
API_URL="http://localhost:1337"
HEALTH_ENDPOINT="/api/health"

check_api() {
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$HEALTH_ENDPOINT")
    if [ "$response" -eq 200 ]; then
        echo "✅ API is healthy"
        return 0
    else
        echo "❌ API is unhealthy (HTTP $response)"
        return 1
    fi
}

check_database() {
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/games?pagination[pageSize]=1")
    if [ "$response" -eq 200 ]; then
        echo "✅ Database is healthy"
        return 0
    else
        echo "❌ Database is unhealthy (HTTP $response)"
        return 1
    fi
}

check_memory() {
    memory_usage=$(ps -o pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -2 | tail -1 | awk '{print $4}')
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        echo "⚠️ High memory usage: ${memory_usage}%"
        return 1
    else
        echo "✅ Memory usage is normal: ${memory_usage}%"
        return 0
    fi
}

# Executar verificações
echo "🔍 Running health checks..."
check_api
check_database
check_memory

exit $?
`;

fs.writeFileSync('scripts/health-check.sh', healthCheckScript);
fs.chmodSync('scripts/health-check.sh', '755');

console.log('✅ Monitoramento configurado com sucesso!');
console.log('📊 Para iniciar o monitoramento:');
console.log('   cd monitoring && docker-compose up -d');
console.log('🌐 Acesse:');
console.log('   - Prometheus: http://localhost:9090');
console.log('   - Grafana: http://localhost:3000 (admin/admin123)');
console.log('   - Alertmanager: http://localhost:9093');
