# Builds the four step emblems for the "Who holds you to it" band so that they
# sit on the parchment with no box.
#
#   powershell -File FRONTEND/tools/make-step-icons.ps1
#   powershell -File FRONTEND/tools/make-step-icons.ps1 -Source1 "C:\path\to\temple.png"
#
# THE BOX. Each source emblem is drawn on its own cream ground, and that cream
# is not #F2E9D2. Placed on the section as-is it is a visible rectangle, and
# mix-blend-mode:multiply DARKENS it rather than hiding it — which is why the
# icons read as tiles rather than as printing. Same problem the fork plates and
# the loading-screen temple had, same fix: the ink is lifted onto a transparent
# ground, alpha taken from how dark each pixel is, so what remains is the
# drawing and nothing else. There is no ground left to be the wrong shade.
#
# COLOUR IS PRESERVED, unlike the loader temple which is flattened to one sepia.
# These four are a set with their own tones — the wax seal in particular is red
# and would die as brown — so each keeps its own hue and only loses its paper.
#
# The edges get a light dissolve as well. It is small (4%) because these are
# emblems with white space around them rather than scenes running to the frame,
# but without it any hatching that does reach an edge stops on a straight line.
#
# Output is 256px for icons rendered at ~63px, so they hold at 2x and beyond.

param(
    [string]$Source1 = '',   # CONNECT — pass to replace the temple art
    [string]$Source2 = '',
    [string]$Source3 = '',
    [string]$Source4 = '',
    [int]$Size = 256,
    [double]$EdgeDepth = 0.04,
    [double]$Strength = 1.0,
    [double]$Contrast = 1.0
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class StepIcon
{
    static float Hash(int x, int y, int seed)
    {
        unchecked {
            int h = x * 374761393 + y * 668265263 + seed * 1274126177;
            h = (h ^ (h >> 13)) * 1274126177;
            return ((h ^ (h >> 16)) & 0x7fffffff) / 2147483647f;
        }
    }
    static float S(float t) { return t * t * (3f - 2f * t); }
    static float C01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }
    static float Value2(float x, float y, int seed)
    {
        int xi = (int)Math.Floor(x), yi = (int)Math.Floor(y);
        float u = S(x - xi), v = S(y - yi);
        float a = Hash(xi, yi, seed), b = Hash(xi + 1, yi, seed);
        float c = Hash(xi, yi + 1, seed), d = Hash(xi + 1, yi + 1, seed);
        return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    }
    static float Fbm(float x, float y, int seed, int oct)
    {
        float sum = 0f, amp = 0.5f, f = 1f, norm = 0f;
        for (int i = 0; i < oct; i++) { sum += amp * Value2(x * f, y * f, seed + i * 101); norm += amp; f *= 2f; amp *= 0.5f; }
        return sum / norm;
    }
    static float Ramp(float d, float depth) { return depth <= 1f ? 1f : S(C01(d / depth)); }

    public static string Go(string src, string dst, int S_, double edgeDepth,
                            double strength, double contrast)
    {
        var b = new Bitmap(src);

        /* Crop to the ink, so the emblem fills its box rather than floating in
           a margin the section then has to allow for. */
        var d0 = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var sa = new byte[d0.Stride * b.Height];
        Marshal.Copy(d0.Scan0, sa, 0, sa.Length);
        b.UnlockBits(d0);

        int[] hist0 = new int[256];
        for (int i = 0; i < sa.Length; i += 4)
        {
            int L = (int)(0.2126 * sa[i + 2] + 0.7152 * sa[i + 1] + 0.0722 * sa[i]);
            if (L > 255) L = 255; hist0[L]++;
        }
        long n0 = (long)b.Width * b.Height, c0 = 0; int paper0 = 255;
        for (int i = 0; i < 256; i++) { c0 += hist0[i]; if (c0 >= (long)(n0 * 0.97)) { paper0 = i; break; } }
        int thresh = (int)(paper0 * 0.86);

        int minX = b.Width, maxX = -1, minY = b.Height, maxY = -1;
        for (int y = 0; y < b.Height; y++)
            for (int x = 0; x < b.Width; x++)
            {
                int i = y * d0.Stride + x * 4;
                float L = 0.2126f * sa[i + 2] + 0.7152f * sa[i + 1] + 0.0722f * sa[i];
                if (L < thresh) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
            }
        int pad = (int)(Math.Max(maxX - minX, maxY - minY) * 0.03);
        minX = Math.Max(0, minX - pad); minY = Math.Max(0, minY - pad);
        maxX = Math.Min(b.Width - 1, maxX + pad); maxY = Math.Min(b.Height - 1, maxY + pad);
        int cw = maxX - minX + 1, ch = maxY - minY + 1;
        int side = Math.Max(cw, ch);
        int sx = minX - (side - cw) / 2, sy = minY - (side - ch) / 2;

        var o = new Bitmap(S_, S_, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(o))
        {
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
            g.DrawImage(b, new Rectangle(0, 0, S_, S_), sx, sy, side, side, GraphicsUnit.Pixel);
        }
        b.Dispose();

        var d = o.LockBits(new Rectangle(0, 0, S_, S_), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * S_];
        Marshal.Copy(d.Scan0, a, 0, a.Length);

        int[] hist = new int[256];
        for (int i = 0; i < a.Length; i += 4)
        {
            int L = (int)(0.2126 * a[i + 2] + 0.7152 * a[i + 1] + 0.0722 * a[i]);
            if (L > 255) L = 255; hist[L]++;
        }
        long n = (long)S_ * S_, c2 = 0; int paper = 255;
        for (int i = 0; i < 256; i++) { c2 += hist[i]; if (c2 >= (long)(n * 0.97)) { paper = i; break; } }

        float baseD = (float)(edgeDepth * S_);
        for (int y = 0; y < S_; y++)
            for (int x = 0; x < S_; x++)
            {
                int i = y * d.Stride + x * 4;
                float L = 0.2126f * a[i + 2] + 0.7152f * a[i + 1] + 0.0722f * a[i];
                float u = C01(1f - L / paper);
                if (contrast != 1.0) u = C01((u - 0.30f) * (float)contrast + 0.30f);
                float ink = u * (float)strength;

                float edge = 1f;
                if (baseD > 1f)
                {
                    float jx = 10f * (Fbm(x / 22f, y / 22f, 4801, 3) - 0.5f) * 2f;
                    float jy = 10f * (Fbm(x / 22f, y / 22f, 4811, 3) - 0.5f) * 2f;
                    edge = Math.Min(Math.Min(Ramp(x + jx, baseD), Ramp(S_ - 1 - x + jx, baseD)),
                                    Math.Min(Ramp(y + jy, baseD), Ramp(S_ - 1 - y + jy, baseD)));
                }

                /* RGB is left alone. These four are a set with their own tones
                   and the wax seal is red; flattening to one sepia would kill
                   it. Only the paper goes. */
                a[i + 3] = (byte)(C01(ink * edge) * 255f + 0.5f);
            }
        Marshal.Copy(a, 0, d.Scan0, a.Length);
        o.UnlockBits(d);
        o.Save(dst, ImageFormat.Png);
        o.Dispose();
        return string.Format("{0} -> {1}x{1}, paper L={2}, crop {3}px", System.IO.Path.GetFileName(dst), S_, paper, side);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"
$srcDir = "$root\FRONTEND\tools\sources"

$sources = @($Source1, $Source2, $Source3, $Source4)
for ($i = 0; $i -lt 4; $i++) {
    $n = $i + 1
    $s = $sources[$i]
    if (-not $s) {
        # fall back to the committed source if there is one, else the live icon
        $kept = "$srcDir\step-0$n-source.png"
        $s = if (Test-Path $kept) { $kept } else { "$img\fork-step-0$n.png" }
    }
    Write-Output ([StepIcon]::Go($s, "$img\fork-step-0$n.png", $Size, $EdgeDepth, $Strength, $Contrast))
}
Get-ChildItem "$img\fork-step-0*.png" | Select-Object Name, Length
