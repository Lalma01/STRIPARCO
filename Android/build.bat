@echo off
REM STRIPARCO Android – build script
echo ============================================
echo  STRIPARCO Android – APK keszitese
echo ============================================
echo.

if not exist gradlew.bat (
  echo Wrapper hianyzik, generalas...
  gradle wrapper --gradle-version 8.7 || ( echo HIBA: gradle wrapper sikertelen & pause & exit /b 1 )
)

echo [1/2] Release APK forditasa...
call gradlew.bat assembleRelease
if %errorlevel% neq 0 ( echo HIBA: build sikertelen! & pause & exit /b 1 )

if not exist release mkdir release
copy /Y app\build\outputs\apk\release\app-release.apk release\STRIPARCO.apk >nul

echo.
echo ============================================
echo  KESZ! APK: release\STRIPARCO.apk
echo ============================================
pause
