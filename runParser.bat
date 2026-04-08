@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

echo ==============================================
echo  Run Parser Launcher

echo  c1 = parseText2  -^> generatedParser.ts
echo  c2 = parseTextC2 -^> generatedParserC2.ts
echo  c3 = parseTextC3 -^> generatedParserC3.ts
echo  c23 = bloque comun C2/C3 -^> regenera C2 y C3
echo  all = regenera C1, C2 y C3
echo  q   = salir
echo ==============================================
echo.

:loop
set "opt="
set /p "opt=Comando (c1/c2/c3/c23/all/q): "

if /I "!opt!"=="q" goto end

if /I "!opt!"=="c1" (
    call :run_parser "C1" "src\parsers\testParser.ts"
    goto loop
)

if /I "!opt!"=="c2" (
    call :run_parser "C2" "src\parsers\testParserC2.ts"
    goto loop
)

if /I "!opt!"=="c3" (
    call :run_parser "C3" "src\parsers\testParserC3.ts"
    goto loop
)

if /I "!opt!"=="c23" (
    echo.
    echo [runParser] Ejecutando bloque comun C2/C3...
    call :run_parser "C2" "src\parsers\testParserC2.ts"
    call :run_parser "C3" "src\parsers\testParserC3.ts"
    echo.
    goto loop
)

if /I "!opt!"=="all" (
    echo.
    echo [runParser] Ejecutando todos los parsers...
    call :run_parser "C1" "src\parsers\testParser.ts"
    call :run_parser "C2" "src\parsers\testParserC2.ts"
    call :run_parser "C3" "src\parsers\testParserC3.ts"
    echo.
    goto loop
)

echo Opcion no valida: !opt!
echo Usa c1, c2, c3, c23, all o q.
echo.
goto loop

:run_parser
echo.
echo [runParser] Ejecutando %~1...
call npx tsx --no-cache %~2
set "rc=!errorlevel!"
if not "!rc!"=="0" echo [runParser] %~1 termino con errorlevel !rc!
echo.
exit /b !rc!

:end
echo Saliendo...
endlocal
