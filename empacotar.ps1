# Gera o .zip da extensão para enviar à Chrome Web Store, já apontando para o servidor de produção.
# Uso:  .\empacotar.ps1 -Servidor https://monvatti-api.vercel.app
param([Parameter(Mandatory = $true)][string]$Servidor)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$Servidor = $Servidor.TrimEnd("/")
if ($Servidor -notmatch '^https://') { throw "Use o endereço HTTPS do servidor (ex.: https://monvatti-api.vercel.app)." }

$versao = (Get-Content extensao\manifest.json -Raw | ConvertFrom-Json).version
$saida = "dist\extensao"
if (Test-Path dist) { Remove-Item dist -Recurse -Force -Confirm:$false }
New-Item -ItemType Directory -Force $saida | Out-Null
Copy-Item extensao\* $saida -Recurse

$bg = Join-Path $saida "background.js"
$texto = [IO.File]::ReadAllText($bg)
$novo = $texto -replace 'const SERVIDOR = "[^"]*";', "const SERVIDOR = `"$Servidor`";"
if ($texto -notmatch 'const SERVIDOR = "[^"]*";') { throw "Não achei a linha 'const SERVIDOR' em background.js." }
[IO.File]::WriteAllText($bg, $novo, (New-Object Text.UTF8Encoding $false))

$zip = "dist\monvatti-marketplace-$versao.zip"
# Monta o zip entrada por entrada com "/" nos caminhos (o PowerShell 5 grava "\", que a Web Store recusa).
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$base = (Resolve-Path $saida).Path
$arquivo = [IO.Compression.ZipFile]::Open((Join-Path (Get-Location) $zip), "Create")
try {
    Get-ChildItem $base -Recurse -File | ForEach-Object {
        $nome = $_.FullName.Substring($base.Length + 1).Replace("\", "/")
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($arquivo, $_.FullName, $nome) | Out-Null
    }
} finally { $arquivo.Dispose() }
Write-Host "Pronto: $zip (servidor $Servidor). Envie esse arquivo no painel da Chrome Web Store."
