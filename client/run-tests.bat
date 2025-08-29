@echo off
echo WhatsApp MCP Test Client Runner
echo ================================
echo.
echo Choose an option:
echo 1. Run automated test client
echo 2. Run interactive test client
echo 3. Start React development server
echo 4. Build React app for production
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Running automated test client...
    node test-mcp-client.js
    pause
) else if "%choice%"=="2" (
    echo.
    echo Running interactive test client...
    node interactive-mcp-client.js
) else if "%choice%"=="3" (
    echo.
    echo Starting React development server...
    npm run dev
) else if "%choice%"=="4" (
    echo.
    echo Building React app for production...
    npm run build
    echo Build completed! Check the 'dist' folder.
    pause
) else if "%choice%"=="5" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
) 