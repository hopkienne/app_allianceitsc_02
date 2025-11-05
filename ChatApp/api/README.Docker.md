# Docker Deployment Guide for ChatApp

## Prerequisites

- Docker installed on your machine
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Copy the environment variables file
cp .env.example .env

# Edit .env with your actual values
# Then build and run
docker-compose up -d
```

The API will be available at `http://localhost:5000`

### 2. Build Docker Image Only

```bash
# Build the image
docker build -t chatapp-api:latest .

# Run the container
docker run -d \
  -p 5000:8080 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e "ConnectionStrings__DefaultConnection=Host=your-host;Port=19378;Database=chat_app;User Id=avnadmin;Password=your-password;" \
  -e "JwtSettings__Key=your-secret-key" \
  --name chatapp-api \
  chatapp-api:latest
```

## Docker Commands

### Build the image
```bash
docker build -t chatapp-api:latest .
```

### Run the container
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f chatapp-api
```

### Stop the container
```bash
docker-compose down
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

## Environment Variables

The application uses the following environment variables:

- `ASPNETCORE_ENVIRONMENT`: Set to `Development`, `Staging`, or `Production`
- `ASPNETCORE_URLS`: The URLs the app listens on (default: `http://+:8080`)
- `ConnectionStrings__DefaultConnection`: PostgreSQL connection string
- `JwtSettings__Issuer`: JWT issuer
- `JwtSettings__Audience`: JWT audience
- `JwtSettings__Key`: JWT secret key

## Database Migrations

If you need to run migrations in the Docker container:

```bash
# Access the container
docker exec -it chatapp-api bash

# Run migrations (if you have migration commands)
dotnet ef database update
```

## Ports

- **8080**: Internal HTTP port (mapped to 5000 externally)
- **8081**: Internal HTTPS port (optional)

## Health Check

The Docker Compose configuration includes a health check. You can verify the app is running:

```bash
curl http://localhost:5000/health
```

## Production Considerations

1. **Security**:
   - Never commit `.env` file with real credentials
   - Use strong JWT secret keys
   - Consider using Docker secrets or environment-specific configurations

2. **Database**:
   - The current setup uses an external Aiven PostgreSQL database
   - For local development, you can uncomment the PostgreSQL service in `docker-compose.yml`

3. **HTTPS**:
   - For production, configure SSL certificates
   - Update `ASPNETCORE_URLS` to include HTTPS

4. **Logging**:
   - Configure persistent logging volumes
   - Consider using a logging aggregation service

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs chatapp-api

# Check if port is already in use
lsof -i :5000
```

### Database connection issues
- Verify the connection string in `.env`
- Check if the database is accessible from Docker network
- Ensure firewall rules allow the connection

### Build fails
```bash
# Clean build
docker-compose down
docker system prune -a
docker-compose up -d --build
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t chatapp-api:latest .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push chatapp-api:latest
```

## Support

For issues and questions, please refer to the main README.md or create an issue in the repository.
