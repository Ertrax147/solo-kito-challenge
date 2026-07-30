Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Set-Location "C:\Users\crist\.gemini\antigravity-ide\scratch\solo-kito-challenge"
npx astro dev --host --port 4321
