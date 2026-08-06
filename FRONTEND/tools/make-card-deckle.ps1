# Generates the deckle-edge mask for the Performance Contract card.
#
#   powershell -File FRONTEND/tools/make-card-deckle.ps1
#
# A DECKLE EDGE, NOT A TORN ONE, and the distinction is the point. A torn edge
# says the document was damaged — for a contract that reads as voided, which is
# the opposite of what this card is for. A deckle is the soft fibrous edge a
# sheet of handmade paper carries where the pulp met the edge of the mould. It
# is the mark of a sheet made by hand, and it is why good stationery and rag
# paper certificates still have one. Provenance, not injury.
#
# WHAT MAKES IT READ AS PAPER RATHER THAN AS A RAGGED PNG:
#
#   TWO SCALES   a slow wander (period ~90px) that gives the edge its overall
#                shape, plus a fine fibre component (period ~7px) riding on top.
#                One scale alone reads as either a wobble or as noise; paper has
#                both, because the mould deckle is smooth and the fibres are not.
#   FOUR DEPTHS  each edge gets its own base depth and its own noise seed. A
#                sheet where all four edges wander identically reads as a filter.
#   A SOFT RAMP  the alpha falls over ~2.4px rather than cutting, because a
#                deckle THINS before it ends — the last fraction of a millimetre
#                is translucent fibre, not a cliff.
#
# AMPLITUDE, RAISED AFTER THE FIRST BUILD SHIPPED INVISIBLE. Base 3.4 -> 9.5px,
# wander 2.6 -> 7.0, fibre 1.15 -> 2.4. At the original values the edge moved by
# under 1% of the card width — about three device pixels against a soft shadow,
# which is indistinguishable from a straight edge. A deckle nobody can see is
# not a subtle deckle, it is a rectangle. These values put the boundary between
# roughly 4px and 24px in, which reads as handmade at 100% zoom.

param(
    [int]$W = 500,
    [int]$H = 820,
    [int]$Seed = 7714,
    [double]$Depth = 9.5,
    [double]$Wander = 7.0,
    [double]$Fibre = 2.4,
    [double]$Ramp = 2.4
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Deckle
{
    static float C01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }
    static float S(float t) { t = C01(t); return t * t * (3f - 2f * t); }

    static float Hash(int x, int seed)
    {
        unchecked {
            int h = x * 374761393 + seed * 668265263;
            h = (h ^ (h >> 13)) * 1274126177;
            return ((h ^ (h >> 16)) & 0x7fffffff) / 2147483647f;
        }
    }
    /* 1D value noise along an edge */
    static float N1(float t, int seed)
    {
        int i = (int)Math.Floor(t);
        float f = S(t - i);
        return Hash(i, seed) * (1 - f) + Hash(i + 1, seed) * f;
    }
    static float Edge(float t, int seed, float wander, float fibre)
    {
        float slow = (N1(t / 90f, seed) - 0.5f) * 2f * wander;
        float fine = (N1(t / 7f, seed + 991) - 0.5f) * 2f * fibre;
        return slow + fine;
    }

    public static string Go(string dst, int W, int H, int seed,
                            double depth, double wander, double fibre, double ramp)
    {
        var bmp = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        var d = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * H];

        /* Each edge its own base depth and its own seed. */
        float dL = (float)depth * 1.00f, dR = (float)depth * 0.86f;
        float dT = (float)depth * 0.78f, dB = (float)depth * 1.12f;

        for (int y = 0; y < H; y++)
            for (int x = 0; x < W; x++)
            {
                float l = x - (dL + Edge(y, seed + 11, (float)wander, (float)fibre));
                float r = (W - 1 - x) - (dR + Edge(y, seed + 23, (float)wander, (float)fibre));
                float t = y - (dT + Edge(x, seed + 37, (float)wander, (float)fibre));
                float b = (H - 1 - y) - (dB + Edge(x, seed + 53, (float)wander, (float)fibre));

                float m = Math.Min(Math.Min(l, r), Math.Min(t, b));
                float al = S(m / (float)ramp);

                int o = y * d.Stride + x * 4;
                a[o] = 0; a[o + 1] = 0; a[o + 2] = 0;
                a[o + 3] = (byte)(al * 255f + 0.5f);
            }

        Marshal.Copy(a, 0, d.Scan0, a.Length);
        bmp.UnlockBits(d);
        bmp.Save(dst, ImageFormat.Png);

        /* report the widest and narrowest inset actually cut, as a sanity check */
        int minIn = W, maxIn = 0;
        for (int y = 0; y < H; y++)
        {
            int x = 0;
            while (x < W && a[y * d.Stride + x * 4 + 3] < 250) x++;
            if (x < minIn) minIn = x;
            if (x > maxIn) maxIn = x;
        }
        bmp.Dispose();
        return string.Format("{0}x{1}  left edge fully opaque between {2}px and {3}px in", W, H, minIn, maxIn);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"

Write-Output ([Deckle]::Go("$img\card-deckle.png", $W, $H, $Seed, $Depth, $Wander, $Fibre, $Ramp))
Get-Item "$img\card-deckle.png" | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb,1)}}
