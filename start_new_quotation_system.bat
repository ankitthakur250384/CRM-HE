@echo off
echo 🚀 Starting ASP Cranes with New Quotation Print System...
echo.

echo 📊 Starting frontend development server...
cd crm-app\frontend
start "ASP-Frontend" npm run dev

echo.
echo ✅ System started successfully!
echo.
echo 📝 Instructions:
echo   1. Open http://localhost:5173 in your browser
echo   2. Navigate to Quotations section
echo   3. Click "Preview" on any quotation
echo   4. Test the new print system with Preview, Print, Download, and Email functions
echo.
echo 🎯 Features to test:
echo   • Professional quotation preview
echo   • Print functionality with proper formatting
echo   • Download as HTML file
echo   • Email preparation
echo.
pause
