@echo off
echo.
echo ========================================
echo   Fixing .env File
echo ========================================
echo.
echo Creating clean .env file...
echo.

(
echo MONGODB_URI=mongodb+srv://theprogrammerco_db_user:umarawais0329@spark-lms.vglmqix.mongodb.net/spark-lms?retryWrites=true^&w=majority
echo ADMIN_PASSWORD=YourSecureAdminPassword123
echo PORT=4001
) > .env

echo ✅ .env file has been fixed!
echo.
echo ========================================
echo   Testing Connection
echo ========================================
echo.

npm run test:db

echo.
echo ========================================
echo.
pause
