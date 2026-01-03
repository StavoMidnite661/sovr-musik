#!/usr/bin/env pwsh
# Auto-update tracks.json based on files in tracks directory
# Usage: .\update_tracks_fixed.ps1

param(
    [switch]$Backup = $true,
    [string]$BackupPath = "./backup_tracks.json"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Auto-Updating tracks.json ===" -ForegroundColor Cyan

# Get all audio/video files from tracks directory
$tracksDir = "./tracks"
if (-not (Test-Path $tracksDir)) {
    Write-Host "Error: Tracks directory '$tracksDir' not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Scanning tracks directory..." -ForegroundColor Yellow
$files = Get-ChildItem -Path $tracksDir -File | Where-Object {
    $_.Extension -match '\.(mp3|mp4|wav|flac|m4a|aac|ogg)$'
} | Sort-Object Name

if ($files.Count -eq 0) {
    Write-Host "No audio files found in tracks directory!" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($files.Count) audio files" -ForegroundColor Green

# Load existing tracks.json
$tracksJsonPath = "./tracks.json"
$existingTracks = @()
$existingFiles = @{}

if (Test-Path $tracksJsonPath) {
    Write-Host "Loading existing tracks.json..." -ForegroundColor Yellow
    try {
        $jsonContent = Get-Content $tracksJsonPath -Raw
        $existingTracks = $jsonContent | ConvertFrom-Json
        
        # Create lookup table of existing files
        foreach ($track in $existingTracks) {
            $existingFiles[$track.src] = $track
        }
        
        Write-Host "Loaded $($existingTracks.Count) existing tracks" -ForegroundColor Green
    }
    catch {
        Write-Host "Error loading tracks.json: $_" -ForegroundColor Red
        exit 1
    }
}

# Backup existing file if requested
if ($Backup -and (Test-Path $tracksJsonPath)) {
    Write-Host "Creating backup at $BackupPath..." -ForegroundColor Yellow
    Copy-Item $tracksJsonPath $BackupPath
}

# Build new tracks list - FIXED: Only include tracks that correspond to existing files
$newTracks = @()
$addedCount = 0
$skippedCount = 0
$removedCount = 0

Write-Host "Processing files..." -ForegroundColor Yellow

# Create a hash set of current file paths for efficient lookup
$currentFilePaths = @{}
foreach ($file in $files) {
    $srcPath = "tracks/$($file.Name)"
    $currentFilePaths[$srcPath] = $true
}

foreach ($file in $files) {
    $srcPath = "tracks/$($file.Name)"
    
    if ($existingFiles.ContainsKey($srcPath)) {
        # Keep existing track entry
        $newTracks += $existingFiles[$srcPath]
        $skippedCount++
        Write-Host "  Kept: $($file.Name)" -ForegroundColor Yellow
    } else {
        # Create new track entry
        $title = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        $title = $title -replace '\s*\(\d+\)$', ''  # Remove version numbers like (1), (2)
        $title = $title -replace '_\(|\)$', ''     # Clean up formatting
        $title = $title -replace '_', ' '           # Replace underscores with spaces
        
        # Generate unique placeholder color based on file name
        $hash = $file.Name.GetHashCode()
        $hue = [math]::Abs($hash % 360)
        $sat = 70 + ($hash % 30)  # 70-99%
        $light = 40 + ($hash % 20)  # 40-59%
        $color = "hsl($hue, $sat%, $light%)"
        
        # Create safe text for URL encoding
        $safeTitle = [uri]::EscapeDataString($title.Substring(0, [math]::Min(15, $title.Length)))
        
        $newTrack = [PSCustomObject]@{
            title = $title
            artist = "Tunee"
            img = "https://placehold.co/300x300/$([System.Convert]::ToString($hash, 16).PadLeft(6, '0'))/$([System.Convert]::ToString($hash, 16).PadLeft(6, '0'))ff00?text=$safeTitle"
            src = $srcPath
        }
        
        $newTracks += $newTrack
        $addedCount++
        Write-Host "  Added: $($file.Name)" -ForegroundColor Green
    }
}

# FIXED: Actually remove tracks that correspond to missing files
# Check for tracks in existing list that no longer have corresponding files
foreach ($existingTrack in $existingTracks) {
    if (-not $currentFilePaths.ContainsKey($existingTrack.src)) {
        Write-Host "  Removing missing file: $($existingTrack.src)" -ForegroundColor Red
        $removedCount++
    }
}

# Sort tracks by title for consistency
$newTracks = $newTracks | Sort-Object { $_.title }

# Write updated JSON - FIXED: Removed -NoNewline for proper JSON formatting
Write-Host "Writing updated tracks.json..." -ForegroundColor Yellow
try {
    $json = $newTracks | ConvertTo-Json -Depth 10
    $json | Out-File -FilePath $tracksJsonPath -Encoding UTF8
    Write-Host "Successfully updated tracks.json!" -ForegroundColor Green
}
catch {
    Write-Host "Error writing tracks.json: $_" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Total tracks: $($newTracks.Count)" -ForegroundColor White
Write-Host "Added: $addedCount" -ForegroundColor Green
Write-Host "Kept: $skippedCount" -ForegroundColor Yellow
Write-Host "Removed: $removedCount" -ForegroundColor Red

if ($addedCount -gt 0) {
    Write-Host "`nNote: New tracks were added with placeholder images." -ForegroundColor Yellow
    Write-Host "Consider replacing placeholder images with actual artwork." -ForegroundColor Yellow
}