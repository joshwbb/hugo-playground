#!/bin/bash

echo "🚀 Starting Hugo Minify Test..."

# 1. Clean up old test builds
rm -rf test_output

# 2. Run Hugo with the same flags as the GitHub Action
# --gc (Garbage Collection) removes unused cache files
# --minify compresses the output
hugo --minify --gc --destination test_output

# 3. Simple validation: check if the index file exists
if [ -f "test_output/index.html" ]; then
    echo "✅ Success! Build generated in /test_output"
    echo "Check your JS files in test_output to ensure variable names are preserved."
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi