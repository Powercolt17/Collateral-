# Scales a scoped section's CSS block by a factor.
#
# Guards, in order of how badly they would bite:
#   - only lines BETWEEN <style> and </style> are touched
#   - @media condition lines are skipped entirely: breakpoints are about the
#     device, not the design, and moving them changes which layout you get
#   - px values <= 2 are left alone. Those are hairlines and rules; a 1px border
#     scaled to 0.85px renders as a grey smear on some displays and vanishes on
#     others
#   - font-size gets a floor. Below about 9px the mono labels stop being
#     readable, and the whole point of the previous pass was to fix exactly that
#   - vw is scaled ONLY inside clamp(), where it is a type-size term. Elsewhere
#     it is layout (width:100vw) and must not move

param(
    [string]$Path,
    [double]$Factor = 0.85,
    [double]$MinFont = 9.0
)

$lines = [System.IO.File]::ReadAllLines($Path)
$start = -1; $end = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($start -lt 0 -and $lines[$i] -match '<style>') { $start = $i }
    elseif ($lines[$i] -match '</style>') { $end = $i; break }
}
if ($start -lt 0 -or $end -lt 0) { throw "no style block in $Path" }

$round = { param($v) [Math]::Round($v, 1) }
$changed = 0

for ($i = $start + 1; $i -lt $end; $i++) {
    $line = $lines[$i]
    if ($line -match '@media') { continue }
    if ($line -notmatch '\d') { continue }
    $orig = $line

    # 1. font-size, with a floor. Tokenised so pass 2 cannot touch it again.
    #    The floor must never RAISE a size: anything already at or below it just
    #    stays where it is, otherwise "shrink the section" would enlarge its
    #    smallest labels.
    $line = [regex]::Replace($line, 'font-size:(\d+(?:\.\d+)?)px', {
        param($m)
        $n = [double]$m.Groups[1].Value
        $v = $n * $Factor
        if ($v -lt $MinFont) { $v = [Math]::Min($n, $MinFont) }
        'font-size:' + [Math]::Round($v, 1) + 'QQPX'
    })

    # 2. clamp() type terms: the vw is a font size too and has to track.
    if ($line -match 'clamp\(') {
        $line = [regex]::Replace($line, '(\d+(?:\.\d+)?)vw', {
            param($m)
            [string]([Math]::Round([double]$m.Groups[1].Value * $Factor, 2)) + 'vw'
        })
    }

    # 3. everything else in px, leaving hairlines alone.
    $line = [regex]::Replace($line, '(\d+(?:\.\d+)?)px', {
        param($m)
        $v = [double]$m.Groups[1].Value
        if ($v -le 2) { return $m.Value }
        [string]([Math]::Round($v * $Factor, 1)) + 'px'
    })

    $line = $line -replace 'QQPX', 'px'
    if ($line -ne $orig) { $changed++ }
    $lines[$i] = $line
}

[System.IO.File]::WriteAllLines($Path, $lines)
Write-Output ("{0}: {1} lines changed (style block {2}-{3}, factor {4})" -f (Split-Path $Path -Leaf), $changed, ($start + 1), ($end + 1), $Factor)
