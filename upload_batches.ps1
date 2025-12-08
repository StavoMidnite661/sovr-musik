$files = Get-ChildItem "tracks\*.mp4"
$batchSize = 20
$count = 0
$total = $files.Count

Write-Host "Starting batch upload. Total files: $total. Batch size: $batchSize"

foreach ($file in $files) {
    git add -f $file.FullName
    $count++
    
    if ($count % $batchSize -eq 0) {
        Write-Host "Committing batch... ($count / $total)"
        git commit -m "Upload batch ($count/$total)"
        git push
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error pushing batch. Retrying in 10 seconds..."
            Start-Sleep -Seconds 10
            git push
        }
        Start-Sleep -Seconds 3
    }
}

# Push any remaining files
git commit -m "Upload final batch"
git push
Write-Host "Done!"
