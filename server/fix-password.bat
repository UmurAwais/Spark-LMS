@echo off
echo.
echo ========================================
echo   MongoDB Password Fix Tool
echo ========================================
echo.
echo Your password appears to be: umarawais0329
echo.
echo This password looks OK (no special characters).
echo The issue might be:
echo   1. Wrong password
echo   2. Wrong username
echo   3. Incorrect connection string format
echo.
echo ========================================
echo   SOLUTION OPTIONS
echo ========================================
echo.
echo Option 1: Reset Password in MongoDB Atlas
echo ----------------------------------------
echo 1. Opening MongoDB Atlas...
echo.

start https://cloud.mongodb.com/v2#/security/database/users

echo.
echo 2. Follow these steps:
echo    - Click "Edit" on user: theprogrammerco_db_user
echo    - Click "Edit Password"
echo    - Choose "Autogenerate Secure Password"
echo    - COPY the new password
echo    - Click "Update User"
echo    - Wait 1-2 minutes
echo.
echo 3. Then update your .env file with the new password
echo.
echo ========================================
echo.
echo Option 2: Fix Connection String Format
echo ----------------------------------------
echo.
echo Your connection string should look like:
echo MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/DATABASE?options
echo.
echo Example:
echo MONGODB_URI=mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true^&w=majority
echo.
echo ========================================
echo.
pause
