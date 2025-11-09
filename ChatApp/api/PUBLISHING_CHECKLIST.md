# Publishing Checklist for ChatApp.API

## Pre-Publishing Checklist

- [ ] All code changes committed to git
- [ ] Database migrations are up to date
- [ ] Connection string is correct in appsettings.json
- [ ] JWT secret key is set (and secure for production)
- [ ] All unit tests passing
- [ ] Build succeeds without warnings

## Publishing Steps

### Step 1: Build and Publish
```bash
# Navigate to the API project directory
cd ChatApp.API

# Clean previous builds
dotnet clean

# Restore packages
dotnet restore

# Publish the application
dotnet publish -c Release -o ../publish
```

### Step 2: Copy Configuration Files
Copy these files from the `api` folder to the `publish` folder:
- [ ] `start-chatapp.bat`
- [ ] `start-chatapp-dev.bat` (optional)
- [ ] Verify `appsettings.json` is in publish folder
- [ ] Verify `appsettings.Production.json` is in publish folder

### Step 3: Update Configuration (if needed)
Edit the `appsettings.json` in the publish folder:
- [ ] Update connection string for target environment
- [ ] Update JWT settings if needed
- [ ] Set Swagger enabled/disabled as needed
- [ ] Verify correct port numbers in "Urls"

### Step 4: Test Locally
- [ ] Run `start-chatapp.bat`
- [ ] Verify console shows "Now listening on: http://localhost:5000"
- [ ] Open http://localhost:5000/swagger in browser
- [ ] Test a few API endpoints
- [ ] Verify database connectivity
- [ ] Test authentication (if applicable)

### Step 5: Package for Deployment
- [ ] Zip the entire publish folder
- [ ] Or copy to deployment server
- [ ] Ensure all DLL files are included
- [ ] Ensure appsettings files are included

## Post-Deployment Checklist

### On Target Server/Machine:

- [ ] .NET 8 Runtime installed (if not self-contained)
- [ ] Firewall configured to allow port 5000 (or your port)
- [ ] Database accessible from server
- [ ] SSL certificate configured (if using HTTPS)

### Test Deployment:

- [ ] Run the application
- [ ] Check console for errors
- [ ] Access Swagger UI
- [ ] Test API endpoints
- [ ] Test SignalR hub connection
- [ ] Check logs for any errors

## Environment-Specific Configuration

### Development
```json
{
  "ASPNETCORE_ENVIRONMENT": "Development",
  "SwaggerSettings": { "Enabled": true },
  "Urls": "http://localhost:5123;https://localhost:7123"
}
```

### Staging
```json
{
  "ASPNETCORE_ENVIRONMENT": "Staging",
  "SwaggerSettings": { "Enabled": true },
  "Urls": "http://staging-server:5000"
}
```

### Production
```json
{
  "ASPNETCORE_ENVIRONMENT": "Production",
  "SwaggerSettings": { "Enabled": false },
  "Urls": "https://api.yourdomain.com"
}
```

## Common Publishing Scenarios

### Scenario 1: Local Development Testing
```bash
dotnet publish -c Release -o ./publish
cd publish
./start-chatapp-dev.bat
```

### Scenario 2: Production Server (Windows)
```bash
# Self-contained (includes runtime)
dotnet publish -c Release -r win-x64 --self-contained true -o ./publish-prod

# Copy to server
# Update appsettings.Production.json
# Run start-chatapp.bat
```

### Scenario 3: Docker Container
```bash
# Build Docker image
docker build -t chatapp-api:latest .

# Run container
docker run -d -p 5000:8080 \
  -e "ConnectionStrings__DefaultConnection=YourConnectionString" \
  chatapp-api:latest
```

### Scenario 4: Linux Server
```bash
# Publish for Linux
dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish-linux

# On Linux server:
chmod +x ./ChatApp.API
export ASPNETCORE_URLS="http://localhost:5000"
./ChatApp.API
```

## Troubleshooting Checklist

If application won't start:
- [ ] Check console output for specific error
- [ ] Verify .NET 8 Runtime is installed
- [ ] Check file permissions
- [ ] Verify all DLL files are present
- [ ] Check appsettings.json is valid JSON

If can't access Swagger:
- [ ] Verify SwaggerSettings.Enabled = true
- [ ] Check URL includes /swagger path
- [ ] Verify port is correct
- [ ] Check firewall rules
- [ ] Look for errors in console

If database connection fails:
- [ ] Verify connection string
- [ ] Check database server is running
- [ ] Verify network connectivity
- [ ] Check credentials are correct
- [ ] Verify database exists

## Security Checklist for Production

- [ ] Change default JWT secret key
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Consider disabling Swagger
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerts
- [ ] Regular security updates

## Rollback Plan

If deployment fails:
1. [ ] Keep previous version backed up
2. [ ] Document rollback procedure
3. [ ] Test rollback in staging first
4. [ ] Have database backup ready

## Files Needed in Published Folder

Essential files that MUST be present:
- [ ] ChatApp.API.exe (or .dll)
- [ ] All project DLL files
- [ ] appsettings.json
- [ ] appsettings.Production.json (or environment-specific)
- [ ] web.config (if using IIS)
- [ ] All dependency DLLs

Optional but recommended:
- [ ] start-chatapp.bat (for easy startup)
- [ ] README or documentation
- [ ] License files

## Monitoring After Deployment

First 24 hours:
- [ ] Monitor CPU/memory usage
- [ ] Check error logs regularly
- [ ] Monitor database connections
- [ ] Track API response times
- [ ] Monitor user connections
- [ ] Check for any exceptions

## Documentation

Before considering deployment complete:
- [ ] Document deployment process
- [ ] Update API documentation
- [ ] Document environment variables
- [ ] Document port configurations
- [ ] Create troubleshooting guide
- [ ] Update team wiki/docs

## Success Criteria

Deployment is successful when:
- [ ] Application starts without errors
- [ ] All API endpoints respond correctly
- [ ] Database connectivity confirmed
- [ ] SignalR hub working
- [ ] Authentication working
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Monitoring in place

---

## Quick Command Reference

```bash
# Build
dotnet build -c Release

# Publish
dotnet publish -c Release -o ./publish

# Run published app (Windows)
cd publish
.\ChatApp.API.exe

# Run with custom port
set ASPNETCORE_URLS=http://localhost:5000
.\ChatApp.API.exe

# Check .NET version
dotnet --version

# List running processes (Windows)
netstat -ano | findstr :5000

# Stop process by port (Windows PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
```

---

**Last Updated:** Use this checklist for every deployment to ensure consistency and catch issues early.
