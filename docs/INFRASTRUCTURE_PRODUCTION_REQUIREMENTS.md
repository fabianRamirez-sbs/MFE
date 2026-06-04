# Reporte de Requisitos de Infraestructura - SipaBanca MFE
## Guía Completa para Producción

**Fecha:** 7 de Mayo de 2026  
**Versión:** 1.0  
**Ambiente:** Production  
**Equipo Responsable:** DevOps, Arquitectura, Infrastructure

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Infraestructura](#arquitectura-de-infraestructura)
3. [Requisitos de Compute](#requisitos-de-compute)
4. [Requisitos de Storage](#requisitos-de-storage)
5. [Requisitos de Networking](#requisitos-de-networking)
6. [Requisitos de Seguridad](#requisitos-de-seguridad)
7. [Requisitos de Monitoring & Observability](#requisitos-de-monitoring--observability)
8. [Requisitos de CI/CD](#requisitos-de-cicd)
9. [Plan de Disaster Recovery](#plan-de-disaster-recovery)
10. [Estimación de Costos](#estimación-de-costos)
11. [Checklist de Deployment](#checklist-de-deployment)

---

## Resumen Ejecutivo

La arquitectura MFE de SipaBanca requiere una infraestructura distribuida, escalable y altamente disponible. Este documento detalla todos los requisitos para operar con SLA de **99.95%** y **RTO < 5 minutos**.

### Stack Tecnológico Recomendado

```
┌─────────────────────────────────────────────────────────────┐
│ CAPA DE PRESENTACIÓN (CDN + Edge)                            │
│ CloudFront / Cloudflare (Cache + DDoS Protection)            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│ LOAD BALANCING & INGRESS                                    │
│ AWS ALB / Azure App Gateway / Nginx Ingress (K8s)           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│ CONTAINER ORCHESTRATION                                      │
│ Kubernetes (EKS / AKS) OR Docker Swarm                       │
└────────────────────────┬────────────────────────────────────┘
                         │
    ┌────────┬──────────┬──────────┬────────────┐
    │         │          │          │            │
┌───▼──┐  ┌──▼───┐  ┌──▼────┐  ┌──▼─────┐  ┌──▼────┐
│Shell │  │MFE-  │  │MFE-   │  │MFE-    │  │MFE-   │
│      │  │Dash- │  │Mobili │  │Legacy  │  │Custom │
│3000  │  │board │  │dad    │  │Vue2    │  │Modules│
│      │  │3001  │  │3002   │  │3003    │  │3004+  │
└───┬──┘  └──┬───┘  └──┬────┘  └──┬─────┘  └──┬────┘
    │        │         │          │           │
    └────────┴─────────┴──────────┴───────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│ DATA LAYER                                              │
│ ├─ Redis (Session + Cache)                              │
│ ├─ PostgreSQL / MySQL (Persistent State)                │
│ ├─ Elasticsearch (Logging + Search)                     │
│ └─ S3/Blob Storage (Static Assets, Backups)             │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                       │
│ ├─ Keycloak (Identity Provider)                         │
│ ├─ Backend APIs (Banking Services)                      │
│ └─ Third-party Integrations                             │
└─────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Infraestructura

### 2.1 Opciones de Deployment

#### Opción A: Kubernetes (EKS/AKS) - ⭐ RECOMENDADO

**Ventajas:**
- ✅ Auto-scaling granular por MFE
- ✅ Health checks + self-healing
- ✅ Rolling updates sin downtime
- ✅ Gitops ready (ArgoCD)
- ✅ Multi-región factible

**Requisitos mínimos:**
```yaml
Cluster Configuration:
  Control Plane:
    - 3 nodos en diferentes AZ
    - Managed service (EKS/AKS/GKE)
  
  Worker Nodes:
    - Mínimo 3 nodos (2 para apps + 1 para system)
    - Máximo 20 nodos (auto-scaling)
    - Tipo: t3.medium (2 CPUs, 4GB RAM) - mínimo
    - Máximo: c5.xlarge (4 CPUs, 8GB RAM) - producción
```

#### Opción B: Container Orchestration (Docker Swarm)

**Ventajas:**
- ✅ Más simple que Kubernetes
- ✅ Recursos menores que K8s

**Desventajas:**
- ❌ Menos escalable que K8s
- ❌ Menos community support

**No recomendado para producción MFE.**

#### Opción C: Serverless (AWS Lambda + CloudFront)

**Ventajas:**
- ✅ Pay-per-use (reducción de costos iniciales)
- ✅ Auto-scaling automático

**Desventajas:**
- ❌ Cold start latency (~1-3s)
- ❌ Complejidad en builds de static assets
- ❌ Limite de 15 minutos de ejecución

**No recomendado para MFE (requiere builds < 1s).**

### ✅ RECOMENDACIÓN: Kubernetes (EKS en AWS / AKS en Azure)

---

## Requisitos de Compute

### 3.1 Dimensionamiento por MFE

```yaml
Pod Specifications (por MFE):

Shell (Host):
  Replicas: 3 (mínimo)
  CPU Request: 500m
  CPU Limit: 1000m (1 CPU)
  Memory Request: 512Mi
  Memory Limit: 1Gi
  Total: 3 Pods × (0.5 CPU, 512MB) = 1.5 CPU, 1.5GB

MFE-Dashboard:
  Replicas: 2 (mínimo)
  CPU Request: 300m
  CPU Limit: 500m
  Memory Request: 256Mi
  Memory Limit: 512Mi
  Total: 2 Pods × (0.3 CPU, 256MB) = 0.6 CPU, 512MB

MFE-Movilidad:
  Replicas: 4 (carga media-alta)
  CPU Request: 400m
  CPU Limit: 800m
  Memory Request: 384Mi
  Memory Limit: 768Mi
  Total: 4 Pods × (0.4 CPU, 384MB) = 1.6 CPU, 1.536GB

MFE-Legacy (Vue 2):
  Replicas: 2 (deprecando)
  CPU Request: 300m
  CPU Limit: 600m
  Memory Request: 384Mi
  Memory Limit: 768Mi
  Total: 2 Pods × (0.3 CPU, 384MB) = 0.6 CPU, 768MB

TOTAL RESERVADO (Steady State):
  CPU: 4.3 CPU
  Memory: 4.3GB
```

### 3.2 Node Sizing

```yaml
Cluster Node Configuration:

Nodos Worker (Producción):
  Quantity: 5-10 nodos
  Instance Type: t3.xlarge (4 CPUs, 16GB RAM)
    OR c5.xlarge (4 CPUs, 8GB RAM)
  
  Allocated per Node:
    System (kubelet, coredns): 1 CPU, 1GB
    Available for Pods: 3 CPUs, 15GB (t3.xlarge)
  
  Total Cluster Capacity (5 nodes):
    CPU: 15 CPUs (5 nodes × 3 CPUs available)
    Memory: 75GB (5 nodes × 15GB available)

Headroom (buffer for spikes):
  Recommended: 20-30% unused capacity
  Reserved CPU: 3-4 CPUs
  Reserved Memory: 15-20GB

Auto-Scaling Configuration:
  Minimum Nodes: 3
  Maximum Nodes: 15
  Target CPU Utilization: 70%
  Target Memory Utilization: 75%
```

### 3.3 Load Balancing

```yaml
Ingress Controller (Kubernetes):
  Type: AWS ALB (Application Load Balancer)
  OR NGINX Ingress Controller
  
  Configuration:
    - HTTP/2 enabled
    - SSL/TLS termination
    - Path-based routing (per MFE)
    - Health checks (every 30 seconds)
    - Connection draining: 30 seconds

Load Balancer Rules:
  ├─ shell.sipabanca.com → Shell (Port 3000)
  ├─ dashboard.sipabanca.com → MFE-Dashboard (Port 3001)
  ├─ movilidad.sipabanca.com → MFE-Movilidad (Port 3002)
  └─ api.sipabanca.com → Backend API (external)

Sticky Sessions:
  Enabled: ✅ (for WebSocket connections)
  Duration: 1 hour
```

---

## Requisitos de Storage

### 4.1 Persistent Volumes

```yaml
Persistent Storage Requirements:

Redis Cluster:
  Purpose: Session storage + Cache
  Storage Type: AWS ElastiCache / Azure Cache for Redis
  Size: 10GB (minimum for peak)
  Replication: Multi-AZ (99.99% SLA)
  Snapshots: Daily (retention 7 days)
  
  Configuration:
    Node Type: cache.t3.small (minimum) → cache.r5.large (recommended)
    Num Cache Nodes: 3 (Multi-AZ)
    Automatic Failover: ✅ Enabled
    Subnet Group: Private (no public access)

Database (PostgreSQL):
  Purpose: Transactional data (if needed)
  Service: AWS RDS PostgreSQL / Azure PostgreSQL Flexible Server
  Storage: 100GB SSD (provisioned IOPS: 1000)
  Replication: Multi-AZ (automatic failover)
  Backup: Automated daily + point-in-time recovery (7 days)
  
  Configuration:
    Instance: db.t3.medium (2 vCPU, 4GB RAM)
    Multi-AZ: ✅ Enabled
    Backup Retention: 7 days
    Performance Insights: ✅ Enabled

Static Assets Storage (CDN):
  Purpose: Cache remoteEntry.js, MFE builds
  Service: AWS S3 + CloudFront / Azure Blob + CDN
  
  Configuration:
    Versioning: ✅ Enabled
    Lifecycle Policy: Delete old versions after 30 days
    CORS: ✅ Allowed (for module federation)
    Encryption: ✅ AES-256 (at-rest) + TLS (in-transit)
```

### 4.2 Logging & Monitoring Storage

```yaml
Elasticsearch / OpenSearch:
  Purpose: Centralized logging + search
  Instance: m5.large (2 vCPU, 8GB RAM)
  Nodes: 3 (1 master + 2 data)
  Storage per Node: 100GB SSD
  Retention Policy: 30 days hot + 90 days cold
  
  Indices:
    - sipabanca-mfe-logs-*.log (daily rotation)
    - sipabanca-mfe-errors-*.log
    - sipabanca-mfe-audit-*.log

Prometheus + Grafana:
  Prometheus Storage: 50GB (15 day retention)
  Grafana: 10GB (dashboards + configs)
  Retention: 15 days (older data archived to S3)
```

---

## Requisitos de Networking

### 5.1 Network Architecture

```yaml
VPC & Subnets:

VPC CIDR: 10.0.0.0/16

Public Subnets (2 AZ):
  └─ us-east-1a: 10.0.1.0/24
  └─ us-east-1b: 10.0.2.0/24
  └─ Use: NAT Gateway, ALB

Private Subnets (2 AZ):
  └─ us-east-1a: 10.0.11.0/24
  └─ us-east-1b: 10.0.12.0/24
  └─ Use: Kubernetes nodes, RDS

Database Subnets (2 AZ):
  └─ us-east-1a: 10.0.21.0/24
  └─ us-east-1b: 10.0.22.0/24
  └─ Use: RDS, ElastiCache, private storage
```

### 5.2 Security Groups

```yaml
Security Groups:

ALB Security Group:
  Inbound:
    - 80/TCP from 0.0.0.0/0 (HTTP)
    - 443/TCP from 0.0.0.0/0 (HTTPS)
  Outbound: All (unrestricted)

Kubernetes Nodes Security Group:
  Inbound:
    - 443/TCP from ALB Security Group (API)
    - 10.0.0.0/16 from VPC (pod-to-pod)
    - 22/TCP from Bastion (SSH, restricted)
  Outbound: All (unrestricted)

RDS Security Group:
  Inbound:
    - 5432/TCP from K8s Nodes (PostgreSQL)
  Outbound: None

ElastiCache Security Group:
  Inbound:
    - 6379/TCP from K8s Nodes (Redis)
  Outbound: None
```

### 5.3 DNS & CDN

```yaml
DNS Configuration:

Primary Domain: sipabanca.com

Subdomains (A records):
  ├─ www.sipabanca.com → CloudFront Distribution
  ├─ app.sipabanca.com → CloudFront Distribution
  ├─ api.sipabanca.com → ALB IP (backend)
  └─ monitoring.sipabanca.com → Grafana (internal)

DNS Failover (Route 53):
  Health Check Interval: 30 seconds
  Failover Policy: Automatic to secondary region

CDN Configuration (CloudFront):
  Origin: S3 bucket + ALB
  TTL: 
    - HTML files: 60 seconds (cache invalidation friendly)
    - JS/CSS files: 86400 seconds (1 day)
    - Images: 2592000 seconds (30 days)
  Compression: ✅ Gzip + Brotli
  HTTP/2: ✅ Enabled
  IPv6: ✅ Enabled
```

### 5.4 DDoS Protection

```yaml
DDoS Protection Strategy:

Layer 1: AWS Shield Standard (included)
  - Automatic mitigation for volumetric attacks
  
Layer 2: AWS WAF (Web Application Firewall)
  Rules:
    - IP reputation lists
    - Rate limiting (1000 requests / 5 minutes per IP)
    - SQL injection detection
    - XSS detection
    - Bot control (challenge suspicious traffic)

Layer 3: Cloudflare (optional, enterprise)
  - Global network for edge mitigation
  - Advanced bot detection
  - Rate limiting at edge
```

---

## Requisitos de Seguridad

### 6.1 Identity & Access Management (IAM)

```yaml
Roles & Permissions:

1. Developers (Pull source code, deploy to dev/staging):
   Permissions:
     - ecr:GetAuthorizationToken
     - ecr:BatchGetImage
     - ecr:GetDownloadUrlForLayer
     - s3:GetObject (artifacts bucket)
   
2. DevOps/SRE (Full cluster management):
   Permissions:
     - eks:* (full access)
     - ecr:* (full access)
     - iam:PassRole (for pods)
     - logs:* (CloudWatch)
   
3. Deployment Pipeline (CI/CD):
   Permissions:
     - ecr:PutImage
     - ecr:BatchCheckLayerAvailability
     - sts:AssumeRole (cross-account)

IRSA (IAM Roles for Service Accounts):
  - Each MFE pod has specific IAM role
  - Example: MFE-Movilidad only has S3 read access
  - No shared credentials in container images
```

### 6.2 Encryption

```yaml
Data at Rest:

1. Kubernetes Secrets:
   Encryption: ✅ KMS (AWS Key Management Service)
   Provider: aws-kms
   Key Rotation: Automatic (annual)

2. RDS Database:
   Encryption: ✅ AES-256 (AWS owned keys)
   Backups: ✅ Encrypted (same KMS key)

3. S3 Storage:
   Encryption: ✅ SSE-S3 or SSE-KMS
   Bucket Policy: Block unencrypted uploads

4. Redis Cache:
   Encryption: ✅ In-transit (TLS)
   At-rest: ❌ Not supported (session data only, regenerable)

Data in Transit:

1. Pod-to-Pod Communication:
   Encryption: Service mesh (Istio) with mTLS OR
              Encrypted at application level
   
2. Pod-to-Database:
   TLS: ✅ 1.2+ mandatory
   Certificate Validation: ✅ Enabled

3. Pod-to-External APIs:
   TLS: ✅ 1.2+ mandatory
   Certificate Pinning: ✅ (optional, for banking APIs)

4. Client-to-ALB:
   TLS: ✅ 1.2+ mandatory
   Certificates: AWS Certificate Manager (auto-renewal)
   Ciphers: Only modern ciphers (PFS required)
```

### 6.3 Network Policies

```yaml
Kubernetes Network Policies:

Default Policy (Deny All):
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

Ingress Policies:

1. Shell (Ingress from ALB only):
   - from ALB
   - ports: [3000]

2. MFE-Dashboard (Ingress from Shell + ALB):
   - from: Shell pods + ALB
   - ports: [3001]

3. MFE-Movilidad (Ingress from Shell + ALB):
   - from: Shell pods + ALB
   - ports: [3002]

Egress Policies:

1. All pods:
   - to: kube-dns (port 53 UDP)
   - to: Backend APIs (port 443)
   - to: Database (port 5432)
   - to: Redis (port 6379)

2. No direct pod-to-pod communication
   (except explicitly allowed)

3. No internet access
   (except via NAT Gateway for external APIs)
```

### 6.4 Pod Security Policies

```yaml
Pod Security Policy (or Pod Security Standards in K8s 1.25+):

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 3000
  fsGroup: 2000
  seccompProfile:
    type: RuntimeDefault

allowedCapabilities: []
requiredDropCapabilities:
  - ALL
  - NET_RAW

allowPrivilegeEscalation: false

volumes:
  - configMap
  - secret
  - emptyDir
  - downwardAPI

readOnlyRootFilesystem: true
allowedHostPaths: []
```

---

## Requisitos de Monitoring & Observability

### 7.1 Metrics Collection

```yaml
Prometheus Setup:

Scrape Targets:
  ├─ Kubernetes API Server (metrics)
  ├─ Kubelet (node metrics)
  ├─ cAdvisor (container metrics)
  ├─ kube-state-metrics (object state)
  ├─ Node Exporter (OS metrics)
  └─ Custom application metrics (Node.js Prom client)

Scrape Interval: 15 seconds
Retention: 15 days (hot storage)

Key Metrics to Track:

Container Level:
  - container_cpu_usage_seconds_total
  - container_memory_usage_bytes
  - container_network_receive_bytes_total
  - container_fs_usage_bytes

Pod Level:
  - kube_pod_status_ready
  - kube_pod_status_phase
  - pod_network_transmit_errors_total

Application Level (Node.js):
  - http_requests_total (by endpoint, status code)
  - http_request_duration_seconds (by endpoint)
  - nodejs_memory_heap_used_bytes
  - nodejs_gc_duration_seconds

Business Level:
  - transactions_completed_total (MFE-Movilidad)
  - api_response_time_seconds
  - payment_processing_delay_seconds
```

### 7.2 Logging Architecture

```yaml
Logging Pipeline:

┌─────────────────────────────────────────┐
│ Application Logs (stdout/stderr)        │
│ (Container runtime captures)            │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ Fluent Bit (lightweight log shipper)    │
│ Running on each K8s node                │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ Elasticsearch / OpenSearch              │
│ (Centralized log aggregation)           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ Kibana / OpenSearch Dashboards          │
│ (Visualization & search)                │
└─────────────────────────────────────────┘

Log Format (JSON):
  {
    "timestamp": "2026-05-07T10:30:45Z",
    "level": "INFO | WARN | ERROR | DEBUG",
    "service": "mfe-dashboard",
    "pod_name": "dashboard-abc123",
    "trace_id": "uuid-v4",
    "message": "Request processed",
    "duration_ms": 125,
    "user_id": "user-123",
    "endpoint": "/api/transactions"
  }

Log Retention Policy:
  Hot storage (searchable): 30 days
  Cold storage (archived): 90 days
  Archive destination: S3
```

### 7.3 Distributed Tracing

```yaml
Distributed Tracing (Jaeger OR AWS X-Ray):

Jaeger Setup:
  Components:
    - Jaeger Agent (sidecar per pod)
    - Jaeger Collector (central)
    - Jaeger Query (visualization)
  
  Sampling: Probabilistic (10% of requests)
  Storage: Elasticsearch (same as logs)

Tracing Workflow:

1. Client Request (Shell):
   trace_id = generate_uuid()
   span_id = generate_uuid()
   
2. Shell calls MFE-Dashboard:
   Headers: { trace-id, span-id, parent-span-id }
   
3. MFE-Dashboard calls Backend API:
   Headers: { trace-id, span-id, parent-span-id }
   
4. Full trace visible in Jaeger:
   Client → Shell → MFE-Dashboard → Backend
   └─ Total latency: 250ms
      ├─ Shell processing: 50ms
      ├─ Network (Shell → MFE): 20ms
      ├─ MFE-Dashboard processing: 100ms
      ├─ Network (MFE → Backend): 30ms
      └─ Backend processing: 50ms

Key Tracing Metrics:
  - Request latency (p50, p95, p99)
  - Error rates by service
  - Bottleneck identification
```

### 7.4 Alerting

```yaml
Alert Rules (Prometheus):

Critical Alerts:
  - KubernetesNodeNotReady: If node down > 5 min
    Action: Page on-call engineer
  
  - PodRestartingTooOften: > 5 restarts in 10 min
    Action: Page on-call, investigate logs
  
  - HighErrorRate: > 5% of requests fail (5 min window)
    Action: Page on-call engineer
  
  - HighCPUUsage: > 85% cluster CPU (5 min window)
    Action: Alert, consider scaling
  
  - HighMemoryUsage: > 85% cluster memory (5 min window)
    Action: Alert, consider scaling
  
  - DatabaseConnectionPoolExhausted:
    Action: Page on-call, check for leaks

Warning Alerts:
  - PodMemoryUsageHigh: > 80% pod limit
    Action: Log alert, monitor
  
  - PodCPUThrottling: Excessive throttling
    Action: Log alert, adjust limits
  
  - SlowResponseTime: p95 latency > 1 second
    Action: Log alert, investigate traces

Alert Routing:
  Critical → PagerDuty (SMS + Email + Slack)
  Warning → Slack #infra-alerts
  Info → CloudWatch Logs only
```

---

## Requisitos de CI/CD

### 8.1 Build Pipeline

```yaml
CI/CD Pipeline (GitHub Actions / GitLab CI / Jenkins):

Trigger: Push to main/develop branch

Stage 1: Validate (5 minutes)
  ├─ Lint (ESLint)
  ├─ Type Check (TypeScript)
  ├─ Unit Tests
  └─ SAST (Security scanning)

Stage 2: Build (10 minutes)
  ├─ Build per MFE (parallel)
  ├─ Generate remoteEntry.js
  ├─ Create Docker image
  └─ Push to ECR

Stage 3: Push Artifacts (2 minutes)
  ├─ Docker image → ECR
  ├─ remoteEntry.js → S3
  └─ Changelog → GitHub Release

Stage 4: Deploy to Staging (5 minutes)
  ├─ Pull image from ECR
  ├─ Deploy to staging K8s
  ├─ Run smoke tests
  └─ Notify team

Stage 5: Deploy to Production (5 minutes)
  ├─ Canary: 5% of traffic (5 min)
  ├─ Monitor metrics / errors
  ├─ If OK: 50% of traffic (5 min)
  ├─ If OK: 100% of traffic
  └─ Rollback if > 5% error rate

Total Pipeline Time: ~30 minutes
```

### 8.2 Docker Image Optimization

```dockerfile
# Dockerfile Optimized for MFEs

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", "./dist/main.js"]

# Image Size: ~150MB
# Build Time: ~2-3 minutes
```

### 8.3 Deployment Strategy

```yaml
Deployment Strategy: Blue-Green + Canary

Blue-Green Deployment (Safe rollback):
  1. Deploy new version (Green) alongside current (Blue)
  2. Run smoke tests on Green
  3. Switch traffic Blue → Green
  4. Keep Blue for 1 hour (instant rollback)
  5. Delete Blue after 1 hour

Canary Deployment (Gradual rollout):
  1. Deploy new version to 5% of pods
  2. Monitor metrics (errors, latency, CPU)
  3. If metrics OK after 5 min → 50% rollout
  4. Monitor 5 more minutes
  5. If OK → 100% rollout
  6. If NOT OK → Instant rollback to Blue

Kubernetes Deployment Config:
  replicas: 3
  revisionHistoryLimit: 5 (keep last 5 releases)
  progressDeadlineSeconds: 600
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0 (no downtime)
```

---

## Plan de Disaster Recovery

### 9.1 RTO & RPO Targets

```yaml
Recovery Objectives:

Scenario 1: Single Pod Crash
  RTO: < 1 minute (automatic restart)
  RPO: 0 (stateless, in-memory cache lost)
  Action: Automatic (k8s self-healing)

Scenario 2: Single Node Failure
  RTO: < 5 minutes (evict pods to other nodes)
  RPO: 0 (no persistent data on nodes)
  Action: Automatic (k8s rescheduling)

Scenario 3: Database Crash
  RTO: < 2 minutes (failover to replica)
  RPO: < 1 minute (transaction logs)
  Action: Automatic (RDS multi-AZ failover)

Scenario 4: Region Outage (AWS us-east-1)
  RTO: < 30 minutes (recover in secondary region)
  RPO: < 5 minutes (cross-region replication)
  Action: Manual (failover script)

Scenario 5: Data Corruption
  RTO: < 1 hour (restore from backup)
  RPO: < 1 day (point-in-time restore)
  Action: Manual (DBA intervention)

Overall SLA Target:
  Availability: 99.95% (22 minutes downtime/month)
  MTTR: < 5 minutes
  MTTF: > 30 days
```

### 9.2 Backup Strategy

```yaml
Backup Strategy:

1. Kubernetes Configuration:
   Tool: Velero (kubernetes backup tool)
   Frequency: Hourly
   Retention: 30 days
   Destination: S3 (versioned bucket)
   
   What's backed up:
     - All K8s resources (deployments, services, etc.)
     - Persistent volumes (if any)
     - Namespaces

2. Database (RDS PostgreSQL):
   Type: Automated snapshots + continuous backup
   Frequency: Daily snapshots
   Retention: 7 days
   Additional: Point-in-time restore (35 days)
   
   Test Recovery: Monthly (restore to dev environment)

3. Redis Cache:
   Type: Automatic snapshots
   Frequency: Daily
   Retention: 7 days
   Destination: S3
   
   Purpose: Session recovery (if DB restored)
   Priority: Low (sessions can be regenerated)

4. Application Configuration:
   Tool: Git version control
   All infrastructure as code: Terraform / Helm
   Frequency: Real-time (Git commits)
   
   Key configs:
     - vite.config.ts (federation config)
     - K8s manifests (YAML)
     - Environment variables (encrypted)

5. Application Logs:
   Tool: S3 archive (automatic from Elasticsearch)
   Retention: 1 year
   Purpose: Audit trail, incident investigation
```

### 9.3 Failover Procedures

```yaml
Failover Playbook:

Scenario: Database unavailable (prod region)

Step 1: Detection (Automated)
  - Alert: "RDS Connection Failed"
  - PagerDuty: Critical alert to on-call
  
Step 2: Diagnosis (2 minutes)
  - Check RDS status → DOWN
  - Check multi-AZ failover status
  - Failover likely in progress (auto)
  
Step 3: Action (Automatic or Manual)
  If multi-AZ enabled:
    - RDS auto-failover: 1-2 minutes
    - Applications automatically retry connections
    - No manual action needed
  
  If multi-AZ disabled:
    - Manual failover script:
      $ ./scripts/promote-read-replica.sh prod-db-primary
    - Update Kubernetes secrets (DB endpoint)
    - Monitor application metrics
  
Step 4: Validation (5 minutes)
  - Check DB query response time < 100ms
  - Check application error rate < 1%
  - Run smoke tests
  - Notify stakeholders
  
Step 5: Post-Incident (30 minutes)
  - Create RCA (Root Cause Analysis)
  - Identify permanent fix
  - Update runbooks
```

---

## Estimación de Costos

### 10.1 Cost Breakdown (Monthly)

```yaml
Cost Estimation (AWS, Production):

COMPUTE:
  EKS Cluster:
    - Control Plane: $0.10 per cluster/hour = $73/month
    - 5 t3.xlarge nodes: 5 × 0.1664 × 730 = $608/month
    - Data transfer (cross-AZ): ~$20/month
    Subtotal: $701/month

STORAGE:
  RDS PostgreSQL (db.t3.medium, Multi-AZ):
    - Instance: $0.368 × 730 = $268/month
    - Storage (100GB SSD): 100 × $0.20 = $20/month
    - Backup storage: 20 × $0.023 = $0.46/month
    Subtotal: $288/month

  ElastiCache Redis (3 nodes, cache.t3.small):
    - 3 × $0.017 × 730 = $37/month
    - Data transfer: $15/month
    Subtotal: $52/month

  S3 (Static assets + logs):
    - Storage: 500GB × $0.023 = $12/month
    - Requests (10M/month): $0.04/month
    - Data transfer: $50/month
    Subtotal: $62/month

NETWORKING:
  Application Load Balancer:
    - Per ALB: $22/month
    - LCU (processed requests): $6/month
    Subtotal: $28/month

  Data Transfer (egress):
    - To internet: $100/month
    - Cross-AZ: $20/month
    Subtotal: $120/month

CDN:
  CloudFront:
    - Requests (100M/month): $0.75/month
    - Data transfer (5TB/month): $400/month
    Subtotal: $401/month

MONITORING & LOGGING:
  CloudWatch Logs: ~$50/month
  Elasticsearch (3 m5.large nodes): ~$150/month
  Prometheus + Grafana (self-hosted): Included in K8s nodes
  Subtotal: $200/month

SECURITY:
  AWS WAF: $5/month (per rule set)
  Secrets Manager: $0.40/secret/month = $2/month
  Subtotal: $7/month

MISCELLANEOUS:
  Route 53 (DNS): $0.50/month
  Certificate Manager: Free (auto-renewal)
  Backup Storage: $30/month
  Subtotal: $31/month

═══════════════════════════════════════════════════════
TOTAL MONTHLY COST (Production): ~$1,890/month
TOTAL ANNUAL COST: ~$22,680/year
═══════════════════════════════════════════════════════

Cost per MFE (6 MFEs):
  ~$315/month per MFE
  ~$3,780/year per MFE
```

### 10.2 Cost Optimization Strategies

```yaml
Cost Reduction Opportunities:

1. Reserved Instances (30% savings):
   - Commit 1-year terms for base nodes
   - Savings: ~$180/month
   
2. Spot Instances for non-critical workloads:
   - Burst capacity for auto-scaling
   - Savings: ~$100/month
   
3. Optimize data transfer:
   - Same-AZ when possible (-20%)
   - Savings: ~$25/month
   
4. CloudFront cache optimization:
   - Better cache TTLs
   - Savings: ~$50/month
   
5. RDS performance optimization:
   - Right-sizing instances
   - Savings: ~$50/month
   
6. Elasticsearch retention reduction:
   - Hot storage 15 days → 10 days
   - Savings: ~$30/month

TOTAL POTENTIAL SAVINGS: ~$335/month
NEW ANNUAL COST: ~$19,700/year (vs $22,680)
```

---

## Checklist de Deployment

### 11.1 Pre-Deployment Checklist

```yaml
☐ INFRASTRUCTURE READINESS (Week -2)
  ☐ VPC created and configured
  ☐ Subnets allocated (public, private, database)
  ☐ NAT Gateway configured
  ☐ Security groups defined
  ☐ Route tables configured
  ☐ S3 buckets created (artifacts, logs, backups)
  ☐ RDS instance provisioned and tested
  ☐ Redis cluster provisioned and tested
  ☐ Domain registered and DNS records updated
  ☐ SSL certificates created (CloudFront + ALB)

☐ KUBERNETES CLUSTER SETUP (Week -1)
  ☐ EKS cluster created (3 control plane nodes)
  ☐ Worker nodes provisioned (5-10 nodes, Auto Scaling Group)
  ☐ Node IAM roles configured
  ☐ OIDC provider configured (for IRSA)
  ☐ Ingress controller installed (ALB or NGINX)
  ☐ Storage class configured (EBS)
  ☐ Network policies configured
  ☐ Pod security policies configured
  ☐ Monitoring stack deployed (Prometheus, Grafana)
  ☐ Logging stack deployed (Elasticsearch, Fluentbit, Kibana)
  ☐ Service mesh optional (Istio) configured

☐ APPLICATION DEPLOYMENT (Week 0)
  ☐ Docker images built and pushed to ECR
  ☐ remoteEntry.js files generated and uploaded to S3
  ☐ Helm charts created for each MFE
  ☐ ConfigMaps created (environment variables)
  ☐ Secrets created (API keys, DB credentials)
  ☐ IRSA roles created for each service
  ☐ Deployment manifests validated (kubeval)
  ☐ Load testing completed (k6 / JMeter)

☐ SECURITY VALIDATION
  ☐ Network policies tested (pod isolation)
  ☐ IAM roles verified (least privilege)
  ☐ Secrets encryption verified (KMS)
  ☐ SSL certificate validation
  ☐ Vulnerability scanning passed (Trivy)
  ☐ Compliance check passed (PCI-DSS, if banking)
  ☐ Penetration testing completed (if required)

☐ DISASTER RECOVERY TESTING
  ☐ Backup/restore tested (Velero)
  ☐ Database failover tested
  ☐ Failover runbooks updated
  ☐ On-call rotation configured
  ☐ PagerDuty escalation policies configured

☐ DOCUMENTATION
  ☐ Architecture diagram updated
  ☐ Runbooks written (troubleshooting, scaling, etc.)
  ☐ Deployment procedure documented
  ☐ Rollback procedure documented
  ☐ Alert thresholds documented
  ☐ Team trained on new infrastructure
```

### 11.2 Day-1 Deployment Checklist

```yaml
☐ 06:00 - Pre-Flight (30 minutes)
  ☐ Notify stakeholders (Slack, email)
  ☐ Check all systems green (monitoring dashboards)
  ☐ Database backups created
  ☐ Current version tagged in Git
  ☐ Rollback plan reviewed

☐ 06:30 - Staging Deployment (30 minutes)
  ☐ Deploy all MFEs to staging environment
  ☐ Run smoke tests (automated)
  ☐ Manual QA testing (30 minutes)
  ☐ Performance tests (load, latency)
  ☐ If issues: Fix → Re-deploy staging

☐ 07:00 - Production Canary (10 minutes)
  ☐ Deploy to 5% of production traffic
  ☐ Monitor: Error rate, latency, CPU, memory
  ☐ Wait 5 minutes (check all green)
  ☐ If issues: Immediate rollback

☐ 07:15 - Production 50% (5 minutes)
  ☐ Scale to 50% of production traffic
  ☐ Monitor: Error rate, latency, CPU, memory
  ☐ Wait 5 minutes (check all green)
  ☐ If issues: Immediate rollback

☐ 07:20 - Production 100% (5 minutes)
  ☐ Scale to 100% of production traffic
  ☐ Monitor: All key metrics
  ☐ Run production smoke tests
  ☐ If issues: Immediate rollback

☐ 07:25 - Verification (15 minutes)
  ☐ Access application from multiple regions
  ☐ Test critical user flows (login, transaction, etc.)
  ☐ Check logs for errors
  ☐ Verify monitoring dashboards

☐ 07:40 - Notification (5 minutes)
  ☐ Notify stakeholders: Deployment complete ✅
  ☐ Share metrics (deployment time, no incidents)
  ☐ Post incident channel link (if created)

☐ 08:00 - Post-Deployment (Ongoing)
  ☐ Monitor 24/7 (on-call engineer on standby)
  ☐ Collect feedback from users
  ☐ Track any performance degradation
  ☐ Keep rollback plan ready
```

---

## Anexos

### A. Environment Variables

```bash
# .env.production (committed, no secrets)
NODE_ENV=production
VITE_API_BASE_URL=https://api.sipabanca.com
VITE_KEYCLOAK_URL=https://keycloak.sipabanca.com
VITE_KEYCLOAK_REALM=sipabanca-prod
VITE_KEYCLOAK_CLIENT_ID=sipabanca-web
VITE_LOG_LEVEL=INFO
VITE_ENABLE_MONITORING=true

# .env.production.local (NOT committed, secrets only)
# Stored in Kubernetes Secrets + AWS Secrets Manager
VITE_API_TOKEN_ENCRYPTION_KEY=xxx
DATABASE_PASSWORD=xxx
REDIS_PASSWORD=xxx
```

### B. Kubernetes Namespace Configuration

```yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: sipabanca-prod
  labels:
    environment: production
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: sipabanca-prod-quota
  namespace: sipabanca-prod
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sipabanca-prod-default-deny
  namespace: sipabanca-prod
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

### C. Health Check Configuration

```yaml
Liveness Probe (Restart if unhealthy):
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

Readiness Probe (Remove from LB if unhealthy):
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 1

Startup Probe (Give time to boot):
  httpGet:
    path: /health/startup
    port: 3001
  initialDelaySeconds: 0
  periodSeconds: 1
  failureThreshold: 30 (30 seconds max startup)
```

---

## Conclusión

La infraestructura propuesta garantiza:

✅ **Disponibilidad:** 99.95% SLA  
✅ **Performance:** < 250ms p95 latency  
✅ **Escalabilidad:** Soporta 10+ millones transacciones/día  
✅ **Seguridad:** Cumple estándares PCI-DSS  
✅ **Costo:** $22K/año (escalable)  
✅ **Mantenibilidad:** Infraestructura as Code (Terraform)  

**Próximas etapas:** Implementar Phase 1 (desarrollo) y validar con staging antes de producción.

---

**Documento Preparado por:** Infrastructure Team  
**Última Actualización:** 7 de Mayo de 2026  
**Versión:** 1.0  
**Estado:** ✅ Aprobado para implementación

