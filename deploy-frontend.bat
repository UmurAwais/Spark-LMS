@echo off
echo ===================================================
echo   🚀 Preparing Frontend for Hostinger (Git Mode)
echo ===================================================

echo.
echo [1/5] Building the project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Exiting.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Entering dist folder...
cd dist

echo.
echo [3/5] Initializing temporary Git repo...
call git init
call git config user.email "deploy@sparktrainings.com"
call git config user.name "Deploy Bot"
call git checkout -b hostinger-build
call git add .
call git commit -m "Deployment Build: %date% %time%"

echo.
echo [4/5] Pushing to 'hostinger-build' branch...
call git remote add origin https://github.com/UmurAwais/Spark-LMS.git
call git push origin hostinger-build --force

echo.
echo [5/5] Cleanup...
rmdir /s /q .git
cd ..

echo.
echo ===================================================
echo   ✅ SUCCESS! 
echo.
echo   Now go to Hostinger and connect the 'Spark-LMS' repo.
echo   ⚠️ IMPORTANT: Select the 'hostinger-build' branch!
echo ===================================================
pause
