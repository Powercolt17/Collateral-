# Bakes the hero plate's grade and its "push back" into the shipped asset.
#
#   powershell -File FRONTEND/tools/soften-hero-plate.ps1
#
# WHY BAKED AND NOT A CSS FILTER. The plate paints on .clt-hero::before, which
# is a full-viewport layer. A runtime filter on that is re-evaluated by the
# compositor and it is the largest single surface on the page, so it is paid for
# on every paint — during the press animation, on scroll, on resize. Baking
# costs one export and nothing at runtime, and the hero is the LCP element.
#
# WHAT IS BAKED, in order:
#   1. desaturate 12%   toward luminance — the engraving is already near-mono,
#                       so this is a nudge, not a conversion
#   2. contrast .94     carried over from the old --plate-grade
#   3. brightness 1.02  likewise
#   4. veil 20%         toward the page's --paper #F1EEE8
#
# Step 4 is the one that matters and it is a VEIL, not a brightness cut. Dimming
# an engraving darkens its paper along with its ink and the whole thing goes
# muddy; pulling it toward the page colour lifts the paper INTO the page and
# takes the ink down with it, which is what "faded" actually looks like. The ink
# still reads, it simply stops competing.
#
# Output stays JPEG. There is no WebP encoder on this machine — no cwebp, no
# ImageMagick, no node, and WIC ships only BMP/GIF/JPEG/PNG/TIFF/WMP. A WebP of
# this would save roughly a third; it needs a box with an encoder or a build
# step. Flagged rather than silently skipped.

param(
    [double]$Desaturate = 0.12,
    [double]$Contrast   = 0.94,
    [double]$Brightness = 1.02,
    [double]$Veil       = 0.20,
    [int]$Quality       = 82
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Soften
{
    static float C01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }

    public static string Go(string src, string dst, double desat, double contrast,
                            double bright, double veil, long quality,
                            int pr, int pg, int pb)
    {
        var b = new Bitmap(src);
        int W = b.Width, H = b.Height;
        var d = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * H];
        Marshal.Copy(d.Scan0, a, 0, a.Length);

        double meanBefore = 0, meanAfter = 0;
        long n = 0;
        float vr = pr / 255f, vg = pg / 255f, vb = pb / 255f;

        for (int i = 0; i < a.Length; i += 4)
        {
            float bl = a[i] / 255f, g = a[i + 1] / 255f, r = a[i + 2] / 255f;
            meanBefore += 0.2126 * r + 0.7152 * g + 0.0722 * bl; n++;

            float lum = 0.2126f * r + 0.7152f * g + 0.0722f * bl;
            r = lum + (r - lum) * (1f - (float)desat);
            g = lum + (g - lum) * (1f - (float)desat);
            bl = lum + (bl - lum) * (1f - (float)desat);

            r = (r - 0.5f) * (float)contrast + 0.5f;
            g = (g - 0.5f) * (float)contrast + 0.5f;
            bl = (bl - 0.5f) * (float)contrast + 0.5f;

            r *= (float)bright; g *= (float)bright; bl *= (float)bright;

            r = r * (1f - (float)veil) + vr * (float)veil;
            g = g * (1f - (float)veil) + vg * (float)veil;
            bl = bl * (1f - (float)veil) + vb * (float)veil;

            r = C01(r); g = C01(g); bl = C01(bl);
            meanAfter += 0.2126 * r + 0.7152 * g + 0.0722 * bl;

            a[i] = (byte)(bl * 255f); a[i + 1] = (byte)(g * 255f); a[i + 2] = (byte)(r * 255f);
        }
        Marshal.Copy(a, 0, d.Scan0, a.Length);
        b.UnlockBits(d);

        ImageCodecInfo jpg = null;
        foreach (var c in ImageCodecInfo.GetImageEncoders()) if (c.MimeType == "image/jpeg") jpg = c;
        var ep = new EncoderParameters(1);
        ep.Param[0] = new EncoderParameter(Encoder.Quality, quality);
        b.Save(dst, jpg, ep);
        b.Dispose();

        return string.Format("{0}x{1}  mean luminance {2:0.000} -> {3:0.000} (+{4:0.0}% toward paper)",
                             W, H, meanBefore / n, meanAfter / n,
                             100.0 * ((meanAfter / n) - (meanBefore / n)) / (meanBefore / n));
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"

Write-Output ([Soften]::Go("$img\collateral-senate-frame.jpg",
                           "$img\collateral-senate-frame-soft.jpg",
                           $Desaturate, $Contrast, $Brightness, $Veil, $Quality,
                           241, 238, 232))
Get-ChildItem "$img\collateral-senate-frame.jpg", "$img\collateral-senate-frame-soft.jpg" |
    Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb)}}
