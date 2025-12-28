#!/bin/bash

echo "🚀 MCP Project Manager - Frontend Deployment"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    echo "Please run this script from the project root"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "📤 Choose deployment option:"
echo ""
echo "1. Vercel (Recommended)"
echo "   vercel --prod"
echo "   Set env: VITE_API_URL=https://mcp-project-manager.onrender.com"
echo ""
echo "2. Netlify"
echo "   netlify deploy --prod --dir=dist"
echo "   Set env: VITE_API_URL=https://mcp-project-manager.onrender.com"
echo ""
echo "3. Netlify Drop (Drag & Drop)"
echo "   Go to: https://app.netlify.com/drop"
echo "   Drag the dist/ folder"
echo "   Set env in Netlify UI: VITE_API_URL=https://mcp-project-manager.onrender.com"
echo ""
echo "4. Manual (Copy dist/ folder to your host)"
echo ""

read -p "Select option (1-4): " option

case $option in
    1)
        echo ""
        echo "🚀 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        vercel --prod
        ;;
    2)
        echo ""
        echo "🚀 Deploying to Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "Installing Netlify CLI..."
            npm install -g netlify-cli
        fi
        netlify deploy --prod --dir=dist
        ;;
    3)
        echo ""
        echo "📂 Opening dist folder and Netlify Drop..."
        open dist
        open https://app.netlify.com/drop
        echo ""
        echo "✅ Drag the dist folder to Netlify Drop"
        echo "⚠️  Don't forget to set environment variable:"
        echo "   VITE_API_URL=https://mcp-project-manager.onrender.com"
        ;;
    4)
        echo ""
        echo "📂 Build output is in: $(pwd)/dist"
        echo "Copy this folder to your web host"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test your deployment:"
echo "1. Visit your deployed URL"
echo "2. Click '⚡ AI Generate'"
echo "3. Enter a test prompt"
echo "4. Watch the real-time streaming!"
echo ""
