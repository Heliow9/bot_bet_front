Write-Host "Buscando problemas de CASE..." -ForegroundColor Cyan

$files = Get-ChildItem -Path .\src -Recurse -Include *.js,*.jsx,*.ts,*.tsx

foreach ($file in $files) {
    $lines = Get-Content $file.FullName

    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]

        if ($line -match 'import .* from "(.*)"' -or $line -match "import .* from '(.*)'") {
            $importPath = $matches[1]

            if ($importPath.StartsWith(".")) {
                $dir = Split-Path $importPath
                $fileName = Split-Path $importPath -Leaf

                $realDir = Join-Path $file.DirectoryName $dir

                if (Test-Path $realDir) {
                    $realFiles = Get-ChildItem $realDir

                    foreach ($realFile in $realFiles) {
                        if ($realFile.BaseName.ToLower() -eq $fileName.ToLower()) {
                            if ($realFile.BaseName -ne $fileName) {
                                Write-Host "CASE DIFERENTE:" -ForegroundColor Yellow
                                Write-Host "Arquivo: $($file.FullName)"
                                Write-Host "Linha: $($i + 1)"
                                Write-Host "Import: $importPath"
                                Write-Host "Real: $($realFile.Name)"
                                Write-Host ""
                            }
                        }
                    }
                }
            }
        }
    }
}

Write-Host "Verificacao finalizada"
