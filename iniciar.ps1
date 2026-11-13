# Liga o backend do Monvatti Marketplaces lendo as chaves do .env (que não vai para o Git).
# Uso: clique com o botão direito > "Executar com o PowerShell", ou rode .\iniciar.ps1 nesta pasta.
Set-Location $PSScriptRoot
if (Test-Path .env) {
    Get-Content .env | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
        $nome, $valor = $_ -split '=', 2
        Set-Item -Path "env:$($nome.Trim())" -Value $valor.Trim()
    }
}
.venv\Scripts\python -m uvicorn backend.main:app --port 8000
