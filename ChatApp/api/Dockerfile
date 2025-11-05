# Use the official .NET 8 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution file
COPY ChatApp.sln ./

# Copy project files
COPY ChatApp.API/ChatApp.API.csproj ChatApp.API/
COPY ChatApp.Application/ChatApp.Application.csproj ChatApp.Application/
COPY ChatApp.Contracts/ChatApp.Contracts.csproj ChatApp.Contracts/
COPY ChatApp.Domain/ChatApp.Domain.csproj ChatApp.Domain/
COPY ChatApp.Infrastructure/ChatApp.Infrastructure.csproj ChatApp.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy the rest of the source code
COPY . .

# Build the application
WORKDIR /src/ChatApp.API
RUN dotnet build -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 8 runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install curl for healthchecks (optional)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the published application from the publish stage
COPY --from=publish /app/publish .

# Expose the port the app runs on
EXPOSE 8080
EXPOSE 8081

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "ChatApp.API.dll"]
