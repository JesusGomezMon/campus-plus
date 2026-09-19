# Abre cada .docx en Word, actualiza el índice y los campos, guarda y exporta a PDF.
param([string]$Carpeta = "$PSScriptRoot\..\entregables", [string]$Filtro = "*.docx")
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  Get-ChildItem -Path $Carpeta -Filter $Filtro | ForEach-Object {
    $doc = $word.Documents.Open($_.FullName, $false, $false)
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Save()
    $pdf = [System.IO.Path]::ChangeExtension($_.FullName, ".pdf")
    $doc.ExportAsFixedFormat($pdf, 17)
    "{0}: {1} paginas" -f $_.Name, $doc.ComputeStatistics(2)
    $doc.Close($false)
  }
} finally { $word.Quit() }
