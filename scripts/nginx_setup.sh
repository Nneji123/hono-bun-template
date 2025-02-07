#!/bin/bash

# Prompt for domain or IP address
read -p "Enter your domain name (e.g., example.com) or IP address (e.g., 35.159.107.7): " DOMAIN_OR_IP

# Update package lists
sudo apt update

# Install Nginx
sudo apt install -y nginx

# Backup the default configuration
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# Create a new Nginx configuration file
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOL
server {
    listen 80;
    server_name ${DOMAIN_OR_IP};

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 500M;
    }
}

server {
    listen 8080;
    server_name ${DOMAIN_OR_IP};

    location / {
        proxy_pass http://localhost:8025;  # MailPit running on port 8025
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 500M;
    }
}
EOL

# Test the Nginx configuration
sudo nginx -t

# Restart Nginx to apply changes
sudo systemctl restart nginx

# Check if the input is a domain or IP
if [[ "${DOMAIN_OR_IP}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "IP address detected. Skipping SSL certificate setup."
else
    # The input is not an IP address, so we assume it's a domain name
    echo "Domain detected. Proceeding with SSL certificate setup."

    # Install Certbot for SSL/TLS
    sudo apt install -y certbot python3-certbot-nginx

    # Obtain and install SSL certificate
    sudo certbot --nginx -d ${DOMAIN_OR_IP}

    # Configure automatic renewal of SSL certificates
    sudo tee /etc/cron.d/certbot-renew > /dev/null <<EOL
0 0 * * * root certbot renew --quiet
EOL

    echo "SSL certificate setup completed."
fi

# Open necessary ports in AWS security groups (manual step)
echo "Ensure that the following ports are open in your AWS security group:"
echo "HTTP (port 80) - Open to the world (0.0.0.0/0)"
echo "HTTPS (port 443) - Open to the world (0.0.0.0/0) if using SSL"
echo "Custom port (e.g., 8000) - Restricted to local access (127.0.0.1) or as needed"

echo "Nginx setup completed. Please verify your security group settings."