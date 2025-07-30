# Environment Setup

This project uses environment files to manage configuration for different environments.

## Environment Files

- `env.development` - Development environment configuration
- `env.production` - Production environment configuration

## Usage

### Development
The development environment file (`env.development`) is configured for local development with:
- Local server endpoint (http://localhost:3000)
- Development environment settings

### Production
The production environment file (`env.production`) needs to be updated with your actual production server details:
- Replace `your-production-domain.com` with your actual domain
- Adjust the SERVER_PORT if needed (currently set to 80)
- Update SERVER_URL and API_BASE_URL with your production URLs

