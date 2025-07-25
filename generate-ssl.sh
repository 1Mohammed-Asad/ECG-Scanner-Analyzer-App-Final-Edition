#!/bin/bash

# SSL Certificate Generation Script for ECG Scanner
# This script generates self-signed SSL certificates for HTTPS

echo "🔐 Generating SSL certificates for secure HTTPS access..."

# Create SSL directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=ECG Scanner/CN=26.101.213.13"

# Set permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✅ SSL certificates generated successfully!"
echo "📍 Certificate location: ./ssl/cert.pem"
echo "🔑 Private key location: ./ssl/key.pem"
echo ""
echo "🔒 Your app will now be accessible at:"
echo "   https://26.101.213.13"
echo "   https://localhost"
