#!/bin/bash

# Stop all running containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Remove all volumes
docker volume rm $(docker volume ls -q)

# Remove all networks (except default ones)
docker network rm $(docker network ls | grep -v "bridge\|host\|none" | awk '{print $1}')

# Remove build cache
docker builder prune -a -f

# Remove all Docker data
docker system prune -a --volumes -f