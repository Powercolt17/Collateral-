# Builds the loading screen's temple from an engraving, so that it sits on the
# parchment with no edge of any kind.
#
#   powershell -File FRONTEND/tools/make-loader-temple.ps1
#   powershell -File FRONTEND/tools/make-loader-temple.ps1 -Source C:\path\to\temple.png -Width 760 -EdgeDepth 0.16
#
# TWO SEPARATE PROBLEMS, and a source engraving usually has both.
#
# 1. THE GROUND. The art is drawn on its own paper, which is never exactly
#    #F4EFE4. Dropped in as-is that paper is a visible rectangle, and
#    mix-blend-mode:multiply darkens it rather than hiding it. So the ink is
#    lifted onto a transparent ground: alpha comes from how dark each pixel is,
#    and the colour is replaced with one flat warm sepia. What is left is the
#    drawing and nothing else.
#
# 2. THE FRAME. Lifting the ground is not enough for a SCENE. Sky hatching,
#    cloud banks and ground shading run all the way to the edge of the source,
#    so once the paper is transparent the drawing still ends on four straight
#    lines of texture — a rectangle made of ink instead of a rectangle made of
#    paper. -EdgeDepth dissolves it: per-edge depths that differ, low-frequency
#    noise along each edge so the fade is deep in places and shallow in others,
#    and a displaced contour so the boundary itself wanders. Same approach as
#    the fork plates, which is why they have no findable edge either.
#
# An emblem already drawn with white space around it needs almost none of (2);
# pass -EdgeDepth 0.04. A full scene wants 0.14-0.20.
#
# Output is 2x the display width so it holds up on retina.

param(
    [string]$Source    = '',
    [int]$Width        = 272,
    [double]$EdgeDepth = 0.05,
    [double]$Strength  = 0.82,
    [double]$Gamma     = 1.0,
    # S-curve on ink density about a low pivot. >1 deepens the crosshatching
    # WITHOUT lifting the paper: the pivot sits under the faint wash, so light
    # hatching gets slightly lighter while the dark strokes go denser. A plain
    # gamma or a higher strength would darken everything and turn the whole
    # engraving muddy, which is the opposite of an engraved banknote.
    [double]$Contrast  = 1.0,
    [int]$InkR = 74, [int]$InkG = 58, [int]$InkB = 40,
    [switch]$CropToInk
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class LoaderTemple
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
    static float Clamp01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }

    static float Value2(float x, float y, int seed)
    {
        int xi = (int)Math.Floor(x), yi = (int)Math.Floor(y);
        float u = S(x - xi), v = S(y - yi);
        float a = Hash(xi, yi, seed),     b = Hash(xi + 1, yi, seed);
        float c = Hash(xi, yi + 1, seed), d = Hash(xi + 1, yi + 1, seed);
        return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
    }
    static float Fbm(float x, float y, int seed, int oct)
    {
        float sum = 0f, amp = 0.5f, f = 1f, norm = 0f;
        for (int i = 0; i < oct; i++) { sum += amp * Value2(x * f, y * f, seed + i * 101); norm += amp; f *= 2f; amp *= 0.5f; }
        return sum / norm;
    }
    static float Ramp(float d, float depth) { return depth <= 1f ? 1f : S(Clamp01(d / depth)); }

    public static string Go(string src, string dst, int W, double edgeDepth,
                            double strength, double gamma, double contrast,
                            bool cropToInk, int inkR, int inkG, int inkB)
    {
        var s = new Bitmap(src);
        int sx = 0, sy = 0, cw = s.Width, ch = s.Height;

        if (cropToInk)
        {
            var sd0 = s.LockBits(new Rectangle(0, 0, s.Width, s.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            var sa = new byte[sd0.Stride * s.Height];
            Marshal.Copy(sd0.Scan0, sa, 0, sa.Length);
            s.UnlockBits(sd0);
            int y0 = (int)(s.Height * 0.18);
            int minX = s.Width, maxX = 0, minY = s.Height, maxY = 0;
            for (int y = y0; y < s.Height; y++)
                for (int x = 0; x < s.Width; x++)
                {
                    int i = y * sd0.Stride + x * 4;
                    float L = 0.2126f * sa[i + 2] + 0.7152f * sa[i + 1] + 0.0722f * sa[i];
                    if (L < 205) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
                }
            int pad = 6;
            minX = Math.Max(0, minX - pad); minY = Math.Max(0, minY - pad);
            maxX = Math.Min(s.Width - 1, maxX + pad); maxY = Math.Min(s.Height - 1, maxY + pad);
            sx = minX; sy = minY; cw = maxX - minX + 1; ch = maxY - minY + 1;
        }

        int H = (int)Math.Round(W * (double)ch / cw);
        var o = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(o))
        {
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
            g.DrawImage(s, new Rectangle(0, 0, W, H), sx, sy, cw, ch, GraphicsUnit.Pixel);
        }
        s.Dispose();

        var d = o.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * H];
        Marshal.Copy(d.Scan0, a, 0, a.Length);

        /* Paper = the 97th percentile, so the drawing's own ground lands on
           fully clear rather than on a faint wash. */
        int[] hist = new int[256];
        for (int i = 0; i < a.Length; i += 4)
        {
            int L = (int)(0.2126 * a[i + 2] + 0.7152 * a[i + 1] + 0.0722 * a[i]);
            if (L > 255) L = 255;
            hist[L]++;
        }
        long n = (long)W * H, c2 = 0; int paper = 255;
        for (int i = 0; i < 256; i++) { c2 += hist[i]; if (c2 >= (long)(n * 0.97)) { paper = i; break; } }

        /* Per-edge dissolve depths, deliberately unequal, each modulated along
           its own length so no edge fades at a constant rate. */
        float baseD = (float)(edgeDepth * W);
        float dL = baseD * 1.00f, dR = baseD * 0.86f, dT = baseD * 1.18f, dB = baseD * 0.72f;
        int seed = 8317;

        for (int y = 0; y < H; y++)
        {
            int row = y * d.Stride;
            for (int x = 0; x < W; x++)
            {
                int i = row + x * 4;

                float L = 0.2126f * a[i + 2] + 0.7152f * a[i + 1] + 0.0722f * a[i];
                float t = Clamp01(L / paper);
                float u = 1f - t;
                /* Pivot 0.30 sits under the faint wash, so the S-curve deepens
                   the strokes and leaves the paper where it is. */
                if (contrast != 1.0) u = Clamp01((u - 0.30f) * (float)contrast + 0.30f);
                float ink = (float)Math.Pow(u, gamma) * (float)strength;

                float edge = 1f;
                if (baseD > 1f)
                {
                    float jx = 20f * (Fbm(x / 26f, y / 26f, seed + 201, 3) - 0.5f) * 2f;
                    float jy = 20f * (Fbm(x / 26f, y / 26f, seed + 211, 3) - 0.5f) * 2f;
                    float nL = 0.45f + 1.10f * Fbm(y / 220f, 0.5f, seed + 11, 2);
                    float nR = 0.45f + 1.10f * Fbm(y / 220f, 0.5f, seed + 23, 2);
                    float nT = 0.45f + 1.10f * Fbm(x / 220f, 0.5f, seed + 37, 2);
                    float nB = 0.45f + 1.10f * Fbm(x / 220f, 0.5f, seed + 53, 2);
                    float al = Ramp(x + jx,         dL * nL);
                    float ar = Ramp(W - 1 - x + jx, dR * nR);
                    float at = Ramp(y + jy,         dT * nT);
                    float ab = Ramp(H - 1 - y + jy, dB * nB);
                    edge = Math.Min(Math.Min(al, ar), Math.Min(at, ab));
                    float grit = Fbm(x / 7f, y / 7f, seed + 131, 2);
                    float outer = Clamp01((0.7f - edge) / 0.7f);
                    edge *= 1f - 0.45f * grit * outer * outer;
                }

                float al2 = Clamp01(ink * edge);
                a[i + 2] = (byte)inkR; a[i + 1] = (byte)inkG; a[i] = (byte)inkB;
                a[i + 3] = (byte)(al2 * 255f + 0.5f);
            }
        }
        Marshal.Copy(a, 0, d.Scan0, a.Length);
        o.UnlockBits(d);
        o.Save(dst, ImageFormat.Png);
        o.Dispose();
        return string.Format("{0}x{1}  paper L={2}  edge depth {3:0}px", W, H, paper, baseD);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"
if (-not $Source) { $Source = "$img\fork-step-01.png"; $CropToInk = $true }

Write-Output ([LoaderTemple]::Go($Source, "$img\loader-temple.png", $Width, $EdgeDepth,
                                 $Strength, $Gamma, $Contrast, [bool]$CropToInk,
                                 $InkR, $InkG, $InkB))
Get-Item "$img\loader-temple.png" | Select-Object Name, Length
