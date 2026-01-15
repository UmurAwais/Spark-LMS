@echo off
echo.
echo ========================================
echo   MongoDB Atlas Quick Fix
echo ========================================
echo.
echo Opening MongoDB Atlas in your browser...
echo.
echo Please follow these steps:
echo.
echo 1. Login to MongoDB Atlas
echo 2. Click "Network Access" in left sidebar
echo 3. Click "ADD IP ADDRESS" button
echo 4. Click "ADD CURRENT IP ADDRESS"
echo 5. Click "Confirm"
echo 6. Wait 1-2 minutes
echo.
echo ========================================
echo.

start https://cloud.mongodb.com/v2#/security/network/accessList

echo.
echo After whitelisting your IP, press any key to test connection...
pause > nul

echo.
echo Testing MongoDB connection...
echo.

cd /d "%~dp0"
node test-mongodb.js

echo.
echo ========================================
echo.
echo If connection succeeded, your database is ready!
echo If it failed, wait another minute and run this script again.
echo.
echo ========================================
pause
