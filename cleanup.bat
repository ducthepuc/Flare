@echo off 
echo Cleaning up processes... 
for /f "tokens=5" %%a in ('netstat -aon | find "3000" | find "LISTENING"') do taskkill /F /PID %%a 
for /f "tokens=5" %%a in ('netstat -aon | find "5000" | find "LISTENING"') do taskkill /F /PID %%a 
del cleanup.bat 
