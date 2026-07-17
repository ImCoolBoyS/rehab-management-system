@echo off
cd /d "C:\Users\Administrator\Desktop\精神康复中心管理系统"
set NODE_ENV=production
python server.py > server_out.log 2>&1