@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\glob-proxy\src\bash.js" %*
) ELSE (
  node  "%~dp0\node_modules\glob-proxy\src\bash.js" %*
)