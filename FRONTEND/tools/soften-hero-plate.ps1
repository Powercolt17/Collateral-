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
#   2. contrast 1.13    ABOUT THE IMAGE MEAN, not about 0.5. See the note in
#                       Go(); this is what recovers the cross-hatching without
#                       darkening the plate
#   3. brightness 1.02  carried over from the old --plate-grade
#   4. veil 18%         toward the page's --paper #F1EEE8
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
    [double]$Contrast   = 1.13,
    [double]$Brightness = 1.02,
    [double]$Veil       = 0.18,
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
    static float Smooth(float t) { t = C01(t); return t * t * (3f - 2f * t); }

    /* UNSHARP MASK, and it is doing something a contrast curve cannot.
       Global contrast separates dark from light across the whole plate; it does
       nothing for a 1px engraved line sitting next to a 1px gap, because both
       move together. Unsharp works on the DIFFERENCE between a pixel and its
       neighbourhood, which is exactly what a line is. Radius 2 and amount .34 —
       small enough that no halo forms around the figures, which is the failure
       mode and the reason this is not set higher. */
    static void Unsharp(byte[] a, int stride, int W, int H, float amount, int radius)
    {
        var blur = new byte[a.Length];
        Array.Copy(a, blur, a.Length);
        int win = radius * 2 + 1;
        var tmp = new float[W * H * 3];
        for (int y = 0; y < H; y++)          /* horizontal pass */
            for (int c = 0; c < 3; c++)
            {
                float sum = 0; int n = 0;
                for (int x = -radius; x <= radius; x++)
                { int xx = Math.Min(W - 1, Math.Max(0, x)); sum += a[y * stride + xx * 4 + c]; n++; }
                for (int x = 0; x < W; x++)
                {
                    tmp[(y * W + x) * 3 + c] = sum / n;
                    int add = Math.Min(W - 1, x + radius + 1), sub = Math.Max(0, x - radius);
                    sum += a[y * stride + add * 4 + c] - a[y * stride + sub * 4 + c];
                }
            }
        for (int x = 0; x < W; x++)          /* vertical pass */
            for (int c = 0; c < 3; c++)
            {
                float sum = 0; int n = 0;
                for (int y = -radius; y <= radius; y++)
                { int yy = Math.Min(H - 1, Math.Max(0, y)); sum += tmp[(yy * W + x) * 3 + c]; n++; }
                for (int y = 0; y < H; y++)
                {
                    float mean = sum / n;
                    int i = y * stride + x * 4 + c;
                    float v = a[i] + amount * (a[i] - mean);
                    blur[i] = (byte)C01(v / 255f) == 0 && v > 255 ? (byte)255 : (byte)Math.Max(0, Math.Min(255, v));
                    int ad = Math.Min(H - 1, y + radius + 1), sb = Math.Max(0, y - radius);
                    sum += tmp[(ad * W + x) * 3 + c] - tmp[(sb * W + x) * 3 + c];
                }
            }
        Array.Copy(blur, a, a.Length);
    }

    /* THE SEAL. It is the climax of the picture and it was 87x57 pixels of a
       1767px plate — smaller on screen than the card's own row labels.
       Magnified about its own centre, enriched, and given a sheen.

       The mask is an ELLIPSE, not a rectangle, feathered from 72% to 100% of
       its radius. A rectangular patch would leave four straight seams in the
       middle of a drawn scroll; an ellipse feathered over a quarter of its own
       radius leaves none, because the blend finishes inside the wax and never
       crosses onto the paper.

       The sheen is one soft highlight placed up and left of centre. That is
       where the plate's own light comes from — every figure is lit from upper
       left — so a sheen anywhere else would read as a sticker. */
    static void Seal(byte[] a, int stride, int W, int H,
                     int cx, int cy, float rx, float ry,
                     float scale, float sat, float contrast, float sheen)
    {
        var src = new byte[a.Length];
        Array.Copy(a, src, a.Length);
        int x0 = Math.Max(0, (int)(cx - rx) - 2), x1 = Math.Min(W - 1, (int)(cx + rx) + 2);
        int y0 = Math.Max(0, (int)(cy - ry) - 2), y1 = Math.Min(H - 1, (int)(cy + ry) + 2);

        float shx = cx - rx * 0.30f, shy = cy - ry * 0.34f;
        float shr = rx * 0.52f;

        for (int y = y0; y <= y1; y++)
            for (int x = x0; x <= x1; x++)
            {
                float nx = (x - cx) / rx, ny = (y - cy) / ry;
                float d = (float)Math.Sqrt(nx * nx + ny * ny);
                if (d > 1f) continue;
                float m = 1f - Smooth((d - 0.72f) / 0.28f);   /* 1 inside, 0 at the rim */
                if (m <= 0f) continue;

                /* sample the unscaled original at the inverse-scaled position */
                float sx = cx + (x - cx) / scale, sy = cy + (y - cy) / scale;
                int ix = (int)sx, iy = (int)sy;
                float fx = sx - ix, fy = sy - iy;
                ix = Math.Min(W - 2, Math.Max(0, ix)); iy = Math.Min(H - 2, Math.Max(0, iy));
                float[] px = new float[3];
                for (int c = 0; c < 3; c++)
                {
                    float p00 = src[iy * stride + ix * 4 + c], p10 = src[iy * stride + (ix + 1) * 4 + c];
                    float p01 = src[(iy + 1) * stride + ix * 4 + c], p11 = src[(iy + 1) * stride + (ix + 1) * 4 + c];
                    px[c] = (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
                }
                float b2 = px[0] / 255f, g2 = px[1] / 255f, r2 = px[2] / 255f;
                float lum = 0.2126f * r2 + 0.7152f * g2 + 0.0722f * b2;
                r2 = lum + (r2 - lum) * sat; g2 = lum + (g2 - lum) * sat; b2 = lum + (b2 - lum) * sat;
                r2 = lum + (r2 - lum); /* keep */
                float mid = 0.42f;
                r2 = mid + (r2 - mid) * contrast; g2 = mid + (g2 - mid) * contrast; b2 = mid + (b2 - mid) * contrast;

                float sd = (float)Math.Sqrt((x - shx) * (x - shx) + (y - shy) * (y - shy)) / shr;
                float sp = sheen * (1f - Smooth(sd));
                r2 += sp; g2 += sp * 0.92f; b2 += sp * 0.80f;

                int o = y * stride + x * 4;
                a[o + 2] = (byte)(255f * C01(a[o + 2] / 255f * (1 - m) + C01(r2) * m));
                a[o + 1] = (byte)(255f * C01(a[o + 1] / 255f * (1 - m) + C01(g2) * m));
                a[o]     = (byte)(255f * C01(a[o] / 255f * (1 - m) + C01(b2) * m));
            }
    }

    static float MeanLuminance(Bitmap b)
    {
        var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * b.Height];
        Marshal.Copy(d.Scan0, a, 0, a.Length);
        b.UnlockBits(d);
        double s = 0; long n = 0;
        for (int i = 0; i < a.Length; i += 4)
        { s += (0.2126 * a[i + 2] + 0.7152 * a[i + 1] + 0.0722 * a[i]) / 255.0; n++; }
        return (float)(s / n);
    }

    public static string Go(string src, string dst, double desat, double contrast,
                            double bright, double veil, long quality,
                            int pr, int pg, int pb)
    {
        var b = new Bitmap(src);
        int W = b.Width, H = b.Height;
        float pivot = MeanLuminance(b);
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

            /* CONTRAST ABOUT THE IMAGE MEAN, NOT ABOUT 0.5. Pivoting at 0.5 on
               a plate whose mean is 0.66 pulls everything toward mid-grey and
               darkens the whole engraving to buy local contrast. Pivoting at
               the mean leaves overall luminance where it is and spends the
               contrast purely on separation — which is what "recover the
               cross-hatching without making it darker" actually requires. */
            r = pivot + (r - pivot) * (float)contrast;
            g = pivot + (g - pivot) * (float)contrast;
            bl = pivot + (bl - pivot) * (float)contrast;

            r *= (float)bright; g *= (float)bright; bl *= (float)bright;

            r = r * (1f - (float)veil) + vr * (float)veil;
            g = g * (1f - (float)veil) + vg * (float)veil;
            bl = bl * (1f - (float)veil) + vb * (float)veil;

            r = C01(r); g = C01(g); bl = C01(bl);
            meanAfter += 0.2126 * r + 0.7152 * g + 0.0722 * bl;

            a[i] = (byte)(bl * 255f); a[i + 1] = (byte)(g * 255f); a[i + 2] = (byte)(r * 255f);
        }
        /* Order matters. Unsharp runs AFTER the veil, so it sharpens what will
           actually ship rather than detail the veil then softens again. The
           seal runs last so the veil never mutes the one thing that is supposed
           to hold the eye. */
        Unsharp(a, d.Stride, W, H, 0.34f, 2);
        Seal(a, d.Stride, W, H, 1473, 687, 62f, 42f, 1.13f, 1.14f, 1.10f, 0.055f);

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
