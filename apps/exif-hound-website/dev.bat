
@echo off
setlocal enabledelayedexpansion

:: Colors for Windows terminal output (Using PowerShell)
set "GREEN=92"
set "YELLOW=93"
set "RED=91"
set "BLUE=94"

:: Function to display colored text (Using PowerShell)
:colorecho
if "%~2"=="" (
    echo.
) else (
    powershell -Command "Write-Host '%~2' -ForegroundColor %~1"
)
goto :eof

:: Function to display script usage
:show_usage
call :colorecho %BLUE% "Exif-Hound Docker Development Environment"
echo.
echo Usage: dev.bat [command]
echo.
echo Commands:
echo   start       - Start the development environment
echo   stop        - Stop the development environment
echo   restart     - Restart the development environment
echo   rebuild     - Rebuild and start the development environment
echo   logs        - Show logs from all containers
echo   logs:app    - Show logs from the Next.js app
echo   logs:stripe - Show logs from the Stripe CLI
echo   ps          - Show running containers
echo   shell       - Open a shell in the app container
echo   test:license [key] - Test a license key
echo   help        - Show this help message
echo.
goto :eof

:: Check if Docker is installed
:check_docker
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :colorecho %RED% "Error: Docker is not installed"
    echo Please install Docker: https://docs.docker.com/get-docker/
    exit /b 1
)

:: Check if docker-compose exists or use docker compose
where docker-compose >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :colorecho %YELLOW% "Warning: docker-compose is not installed. Using 'docker compose' command instead."
    set "DOCKER_COMPOSE=docker compose"
) else (
    set "DOCKER_COMPOSE=docker-compose"
)
goto :eof

:: Check if .env file exists, create from template if missing
:check_env
if not exist .env (
    call :colorecho %YELLOW% "No .env file found. Creating from .env.example..."
    
    if exist .env.example (
        copy .env.example .env >nul
        call :colorecho %GREEN% "Created .env file from example template."
        call :colorecho %YELLOW% "Please edit the .env file with your Stripe API keys before running the application."
    ) else (
        call :colorecho %RED% "Error: Could not find .env.example file"
        exit /b 1
    )
)
goto :eof

:: Start the development environment
:start_dev
call :colorecho %BLUE% "Starting Exif-Hound development environment..."
call :check_env
%DOCKER_COMPOSE% up -d
call :colorecho %GREEN% "Development environment is running!"
call :colorecho %BLUE% "Website: http://localhost:3000"
call :colorecho %YELLOW% "Use dev.bat logs to view logs"
goto :eof

:: Stop the development environment
:stop_dev
call :colorecho %BLUE% "Stopping Exif-Hound development environment..."
%DOCKER_COMPOSE% down
call :colorecho %GREEN% "Development environment stopped"
goto :eof

:: Rebuild the development environment
:rebuild_dev
call :colorecho %BLUE% "Rebuilding Exif-Hound development environment..."
call :check_env
%DOCKER_COMPOSE% up -d --build
call :colorecho %GREEN% "Development environment rebuilt and running!"
call :colorecho %BLUE% "Website: http://localhost:3000"
goto :eof

:: View logs
:show_logs
if "%~1"=="app" (
    %DOCKER_COMPOSE% logs -f app
) else if "%~1"=="stripe" (
    %DOCKER_COMPOSE% logs -f stripe-cli
) else (
    %DOCKER_COMPOSE% logs -f
)
goto :eof

:: Show container status
:show_status
%DOCKER_COMPOSE% ps
goto :eof

:: Open a shell in the app container
:open_shell
%DOCKER_COMPOSE% exec app /bin/sh
goto :eof

:: Test a license key
:test_license
if "%~1"=="" (
    call :colorecho %RED% "Error: No license key provided"
    echo Usage: dev.bat test:license [license_key]
    exit /b 1
)

call :colorecho %BLUE% "Testing license key: %~1"
powershell -Command "Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/verify-license' -Headers @{'Content-Type'='application/json'} -Body '{\"licenseKey\": \"%~1\"}' | ConvertTo-Json -Depth 5"
goto :eof

:: Main function
:main
call :check_docker

if "%~1"=="start" (
    call :start_dev
) else if "%~1"=="stop" (
    call :stop_dev
) else if "%~1"=="restart" (
    call :stop_dev
    call :start_dev
) else if "%~1"=="rebuild" (
    call :stop_dev
    call :rebuild_dev
) else if "%~1"=="logs" (
    call :show_logs "%~2"
) else if "%~1"=="logs:app" (
    call :show_logs "app"
) else if "%~1"=="logs:stripe" (
    call :show_logs "stripe"
) else if "%~1"=="ps" (
    call :show_status
) else if "%~1"=="shell" (
    call :open_shell
) else if "%~1"=="test:license" (
    call :test_license "%~2"
) else if "%~1"=="help" (
    call :show_usage
) else if "%~1"=="--help" (
    call :show_usage
) else if "%~1"=="-h" (
    call :show_usage
) else if "%~1"=="" (
    call :show_usage
) else (
    call :colorecho %RED% "Unknown command: %~1"
    call :show_usage
    exit /b 1
)

goto :end

:: Call the main function with all arguments
call :main %*

:end
endlocal 