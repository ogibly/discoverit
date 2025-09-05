# Enable strict error handling
$ErrorActionPreference = "Stop"

Write-Host "Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Status}}"

# PostgreSQL settings
$DB_CONTAINER = "discoverit-db"
$DB_NAME = "discoverit"
$DB_USER = "discoverit"

Write-Host "Checking PostgreSQL connection and tables..."

try {
    # List all tables in the public schema
    $tables = docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "\dt public.*" 
    if ($tables) {
        Write-Host "PostgreSQL connection OK."
        Write-Host "Tables found:"
        $tables | ForEach-Object { Write-Host " - $_" }

        # Check for specific tables
        $requiredTables = @("devices", "scans")
        foreach ($tbl in $requiredTables) {
            if ($tables -match $tbl) {
                Write-Host "Table '$tbl' exists."
            } else {
                Write-Host "Table '$tbl' NOT found!"
            }
        }
    } else {
        Write-Host "Could not retrieve tables from PostgreSQL."
    }
} catch {
    Write-Host "PostgreSQL connection failed: $_"
}

# FastAPI settings
$APP_URL = "http://localhost:8000/"
$DOCS_URL = "http://localhost:8000/docs"

Write-Host "Checking FastAPI app root endpoint..."
try {
    $response = Invoke-WebRequest -Uri $APP_URL -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "FastAPI root endpoint returned status 200"
    } else {
        Write-Host "FastAPI root endpoint did not return 200 (status: $($response.StatusCode))"
    }
} catch {
    Write-Host "FastAPI root endpoint not reachable"
}

Write-Host "Checking FastAPI /docs endpoint..."
try {
    $docsResponse = Invoke-WebRequest -Uri $DOCS_URL -UseBasicParsing -TimeoutSec 5
    if ($docsResponse.StatusCode -eq 200) {
        Write-Host "Swagger docs available at /docs"
    } else {
        Write-Host "Swagger docs did not return 200 (status: $($docsResponse.StatusCode))"
    }
} catch {
    Write-Host "Swagger docs not reachable"
}

Write-Host "Full health check complete."