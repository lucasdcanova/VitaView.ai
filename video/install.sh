#!/bin/bash

echo "🎬 Installing VitaView.ai Promotional Video dependencies..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "🎥 Next steps:"
    echo ""
    echo "  1. Start Remotion Studio:"
    echo "     npm start"
    echo ""
    echo "  2. Or render the video directly:"
    echo "     npm run build"
    echo ""
    echo "  Output will be saved to: output.mp4"
    echo ""
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
