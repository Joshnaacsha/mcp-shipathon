@echo off
echo WhatsApp MCP Test Client Runner
echo ================================
echo.
echo Choose an option:
echo 1. Run automated test client
echo 2. Run interactive test client
echo 3. Open desktop client in browser
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

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
    echo Opening desktop client in browser...
    start desktop-client.html
    echo Desktop client opened in your default browser!
    pause
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
) 