@echo off
cd /d "C:\Users\Administrator\Desktop\精神康复中心管理系统"
title 精神康复中心管理系统

echo ============================================
echo  精神康复中心管理系统 - ???...
echo ============================================
echo.

echo [1/2] ?? Python API ?? (?? 8000)...
start "Python API" cmd /c "python server.py"

echo [2/2] ?? Vite ??????? (?? 5173)...
echo.
echo ??: http://localhost:5173
echo API:  http://localhost:8000/docs
echo.
echo ??: ????????
echo ? Ctrl+C ????
echo ============================================
npm run dev
pause