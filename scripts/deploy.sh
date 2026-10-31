#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Kevin's Construction OS — Zero-Downtime Production Deployment Pipeline
# Target Domain: https://crm.musfiqdehan.com
# Reverse Proxy: Traefik v3 (external network: traefik_proxy)
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}  Kevin's Construction OS — Zero-Downtime Deployment Pipeline   ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Environment Verification
if [ ! -f ".env.prod" ]; then
    if [ -f ".env.prod.example" ]; then
        log_warning ".env.prod not found! Copying from .env.prod.example..."
        cp .env.prod.example .env.prod
        log_warning "Please update .env.prod with your production secrets before proceeding!"
    else
        log_error "Missing .env.prod and .env.prod.example. Aborting."
        exit 1
    fi
fi

# 2. Check Docker & Compose installation
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH."
    exit 1
fi

# 3. Ensure external Traefik network exists
log_info "Checking Traefik proxy network (traefik_proxy)..."
if ! docker network inspect traefik_proxy >/dev/null 2>&1; then
    log_warning "Network 'traefik_proxy' does not exist yet. Creating bridge network..."
    docker network create traefik_proxy
    log_success "Network 'traefik_proxy' created."
else
    log_success "External network 'traefik_proxy' is present."
fi

# 4. Check if Traefik is running
if ! docker ps --format '{{.Names}}' | grep -q "^traefik$"; then
    log_warning "Traefik container is not currently running."
    log_warning "If you are starting Traefik from the @traefik folder, run:"
    log_warning "  docker compose -f traefik/docker-compose.traefik.yml up -d"
else
    log_success "Traefik reverse proxy is active."
fi

# 5. Build production Docker images ahead of time
log_info "Building production images in background (zero-downtime prep)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod build

# 6. Start database first and wait for healthy status
log_info "Ensuring PostgreSQL 18 database (db) is healthy..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db

until [ "$(docker inspect --format='{{.State.Health.Status}}' crm_prod_db 2>/dev/null)" = "healthy" ]; do
    sleep 2
    echo -n "."
done
echo ""
log_success "PostgreSQL is healthy!"

# 7. Run database migrations and Notion provisioning in one-off container
# This ensures zero downtime when updating the running backend service.
log_info "Executing database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend uv run python manage.py migrate --noinput

log_info "Collecting static assets..."
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend uv run python manage.py collectstatic --noinput

log_info "Provisioning Notion workspace & initial seed records..."
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm backend uv run python manage.py provision_notion

# 8. Start / update full production stack with zero downtime
log_info "Deploying Backend, n8n, and Frontend containers..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --remove-orphans backend n8n frontend

# 9. Wait for Backend container to become healthy
log_info "Waiting for Backend container healthcheck..."
MAX_RETRIES=30
RETRY_COUNT=0
until [ "$(docker inspect --format='{{.State.Health.Status}}' crm_prod_backend 2>/dev/null)" = "healthy" ]; do
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        log_warning "Backend container took longer than expected to become healthy."
        break
    fi
    echo -n "."
done
echo ""
log_success "Backend service is healthy!"

# 10. Wait for n8n container to respond and import workflows
log_info "Configuring n8n workflow automation..."
sleep 5
docker exec -u node crm_prod_n8n n8n import:workflow --input=/workflows/construction_cost_automation.json 2>/dev/null || true
docker exec -u node crm_prod_n8n n8n update:workflow --all --active=true 2>/dev/null || true
log_success "n8n workflow imported and activated."

# 11. Check running containers
echo ""
log_info "Active production containers:"
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

echo ""
log_success "Deployment completed successfully!"
echo -e "${GREEN}Routing Map:${NC}"
echo -e "  • Frontend Web Application : ${BLUE}https://crm.musfiqdehan.com${NC}"
echo -e "  • Backend REST API & Admin : ${BLUE}https://crm.musfiqdehan.com/api${NC}"
echo -e "  • n8n Workflow Automation  : ${BLUE}https://crm.musfiqdehan.com/n8n${NC}"
echo ""
log_info "To view live logs: docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f"
