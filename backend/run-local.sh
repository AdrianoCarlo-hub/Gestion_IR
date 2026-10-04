#!/bin/bash
# Charge les variables d'environnement depuis .env
# puis lance l'application Spring Boot

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERREUR : fichier .env introuvable"
  exit 1
fi

# Charge le .env dans l'environnement du shell
set -a
source .env
set +a

echo "Variables chargees :"
echo "  DB_HOST=$DB_HOST"
echo "  DB_NAME=$DB_NAME"
echo "  DB_USERNAME=$DB_USERNAME"
echo "  JWT_EXPIRATION=$JWT_EXPIRATION"
echo ""
echo "=== Lancement Spring Boot ==="

./mvnw spring-boot:run
