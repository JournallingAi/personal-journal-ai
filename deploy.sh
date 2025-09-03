#!/bin/bash

echo "🚀 AI Journaling App Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git first."
        exit 1
    fi
    
    print_status "All requirements are met! ✅"
}

# Build the application
build_app() {
    print_status "Building the application..."
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    cd client
    npm install
    
    # Build frontend
    print_status "Building frontend..."
    npm run build
    
    cd ..
    print_status "Build completed! ✅"
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_warning "Please edit .env file with your API keys before deploying."
    fi
    
    # Check if required variables are set
    if [ -z "$GEMINI_API_KEY" ]; then
        print_warning "GEMINI_API_KEY not set. Please add it to .env file."
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        print_warning "JWT_SECRET not set. Please add it to .env file."
    fi
}

# Deploy to Railway (Backend)
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    print_status "Please login to Railway..."
    railway login
    
    print_status "Deploying to Railway..."
    railway up
    
    print_status "Backend deployment completed! ✅"
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    cd client
    print_status "Deploying to Vercel..."
    vercel --prod
    
    cd ..
    print_status "Frontend deployment completed! ✅"
}

# Setup GitHub Actions
setup_github_actions() {
    print_status "Setting up GitHub Actions..."
    
    if [ ! -d ".github/workflows" ]; then
        print_status "Creating GitHub Actions directory..."
        mkdir -p .github/workflows
    fi
    
    print_status "GitHub Actions workflow file created!"
    print_warning "Please add the following secrets to your GitHub repository:"
    echo "  - VERCEL_TOKEN"
    echo "  - VERCEL_ORG_ID"
    echo "  - VERCEL_PROJECT_ID"
    echo "  - RAILWAY_TOKEN"
    echo "  - RAILWAY_SERVICE"
}

# Main deployment function
main() {
    echo ""
    print_status "Starting deployment process..."
    
    # Check requirements
    check_requirements
    
    # Check environment
    check_env
    
    # Build app
    build_app
    
    echo ""
    print_status "Choose deployment option:"
    echo "1. Deploy to Railway (Backend)"
    echo "2. Deploy to Vercel (Frontend)"
    echo "3. Setup GitHub Actions"
    echo "4. Full deployment (Backend + Frontend)"
    echo "5. Exit"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            setup_github_actions
            ;;
        4)
            deploy_backend
            echo ""
            deploy_frontend
            echo ""
            setup_github_actions
            ;;
        5)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Deployment process completed! 🎉"
    print_status "Next steps:"
    echo "  1. Configure your domain in Vercel/Railway"
    echo "  2. Set up environment variables"
    echo "  3. Test your application"
    echo "  4. Monitor deployment logs"
}

# Run main function
main 