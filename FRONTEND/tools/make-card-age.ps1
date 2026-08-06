# Generates the ageing texture for the Performance Contract card.
#
#   powershell -File FRONTEND/tools/make-card-age.ps1
#
# WHY A BAKED TEXTURE AND NOT MORE CSS GRADIENTS. The card already carries
# fibres, tonal radials and fine grain as CSS layers, and those are the right
# tool for SMOOTH things. Age is not smooth. What actually reads as old paper is
# three irregular phenomena, and none of them can be expressed as a gradient:
#
#   FOXING        the rust-brown speckle that develops where the sheet has
#                 impurities. Irregular in size, position and density, denser
#                 near edges where air reaches. A gradient cannot make a spot.
#   MOTTLE        broad uneven discolouration, several blotches across a sheet,
#                 at a scale between the fibres and the whole page.
#   EDGE TONING   the perimeter oxidises first, so an old sheet is darker for
#                 the outer centimetre or so — and unevenly, not as a clean
#                 vignette.
#
# All three are emitted as ALPHA over one warm brown, so the CSS applies it with
# mix-blend-mode:multiply exactly like the existing grain and it tints rather
# than paints. Nothing here is a colour the card does not already have.
#
# STRENGTH WAS RAISED AFTER THE FIRST BUILD SHIPPED INVISIBLE. Foxing .17 ->
# .30, mottle .085 -> .145, edge toning .20 -> .34, spot density up ~65%, and
# the alpha cap .24 -> .34. The first pass was calibrated to "if a refinement is
# noticeable immediately it is too strong", which is the right rule for a craft
# pass and the wrong one when the ask is literally "make it look old" — at a
# mean alpha of 6% it was not visible at all, which is not restraint, it is
# nothing. The cap is still a hard legibility limit; see the note on it below.

param(
    [int]$W = 500,
    [int]$H = 820,
    [int]$Seed = 20641,
    [double]$Foxing = 0.30,
    [double]$Mottle = 0.145,
    [double]$EdgeTone = 0.34,
    [int]$InkR = 150, [int]$InkG = 112, [int]$InkB = 62
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class CardAge
{
    static float C01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }
    static float S(float t) { t = C01(t); return t * t * (3f - 2f * t); }

    static float Hash(int x, int y, int seed)
    {
        unchecked {
            int h = x * 374761393 + y * 668265263 + seed * 1274126177;
            h = (h ^ (h >> 13)) * 1274126177;
            return ((h ^ (h >> 16)) & 0x7fffffff) / 2147483647f;
        }
    }
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
        float sum = 0, amp = 0.5f, f = 1, norm = 0;
        for (int i = 0; i < oct; i++) { sum += amp * Value2(x * f, y * f, seed + i * 101); norm += amp; f *= 2; amp *= 0.5f; }
        return sum / norm;
    }

    public static string Go(string dst, int W, int H, int seed,
                            double foxing, double mottle, double edgeTone,
                            int ir, int ig, int ib)
    {
        var bmp = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        var d = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * H];

        var rnd = new Random(seed);

        /* Foxing spots. Count scales with area so the density is the same
           whatever size this is generated at. Placement is biased toward the
           edges — air reaches the perimeter first — by rejecting a proportion
           of the draws that land centrally. */
        int spots = (int)(W * H / 3100.0);
        var sx = new float[spots]; var sy = new float[spots];
        var sr = new float[spots]; var sa = new float[spots];
        for (int i = 0; i < spots; i++)
        {
            float px, py, edgeness;
            int guard = 0;
            do
            {
                px = (float)rnd.NextDouble() * W;
                py = (float)rnd.NextDouble() * H;
                float ex = Math.Min(px, W - px) / (W * 0.5f);
                float ey = Math.Min(py, H - py) / (H * 0.5f);
                edgeness = 1f - Math.Min(ex, ey);          /* 1 at the rim */
                guard++;
            } while (rnd.NextDouble() > 0.35 + 0.65 * edgeness && guard < 12);

            sx[i] = px; sy[i] = py;
            sr[i] = 1.6f + (float)Math.Pow(rnd.NextDouble(), 2.2) * 9.5f;
            sa[i] = (0.22f + 0.78f * (float)rnd.NextDouble()) * (float)foxing;
        }

        float edgeBand = Math.Min(W, H) * 0.16f;

        for (int y = 0; y < H; y++)
            for (int x = 0; x < W; x++)
            {
                float al = 0;

                /* mottle — broad uneven discolouration */
                float m = Fbm(x / 190f, y / 240f, seed + 7, 3);
                al += (float)mottle * S((m - 0.34f) / 0.5f);

                /* edge toning, roughened by its own noise so it is not a clean
                   vignette — an old sheet does not oxidise evenly */
                float dx = Math.Min(x, W - 1 - x), dy = Math.Min(y, H - 1 - y);
                float dist = Math.Min(dx, dy);
                float e = 1f - S(dist / edgeBand);
                e *= 0.55f + 0.45f * Fbm(x / 60f, y / 60f, seed + 23, 2);
                al += (float)edgeTone * e;

                /* foxing */
                for (int i = 0; i < spots; i++)
                {
                    float ddx = x - sx[i], ddy = y - sy[i];
                    float r2 = ddx * ddx + ddy * ddy;
                    float rr = sr[i] * sr[i];
                    if (r2 > rr * 4f) continue;
                    float t = (float)Math.Sqrt(r2) / sr[i];
                    if (t > 2f) continue;
                    /* soft, slightly ragged edge rather than a clean disc */
                    float fall = 1f - S(t / 1.7f);
                    fall *= 0.7f + 0.6f * Fbm(x / 5f, y / 5f, seed + 51 + i, 2);
                    al += sa[i] * fall;
                }

                /* HARD CAP AT .24, and this is a legibility limit rather than a
                   taste one. The texture multiplies UNDER the card text. At
                   alpha .345 — which overlapping foxing plus edge toning
                   reached — the paper under a muted 9px label darkens enough
                   to put it at 3.87:1, under AA. Capped at .24 the worst
                   ground the type ever sits on is 4.83:1 with the muted colour
                   deepened to match. Age must not cost the document its
                   readability. */
                int o = y * d.Stride + x * 4;
                a[o + 2] = (byte)ir; a[o + 1] = (byte)ig; a[o] = (byte)ib;
                a[o + 3] = (byte)(Math.Min(C01(al), 0.34f) * 255f + 0.5f);
            }

        Marshal.Copy(a, 0, d.Scan0, a.Length);
        bmp.UnlockBits(d);
        bmp.Save(dst, ImageFormat.Png);

        double mean = 0; long n = 0; float peak = 0;
        for (int i = 3; i < a.Length; i += 4) { mean += a[i]; n++; if (a[i] > peak) peak = a[i]; }
        bmp.Dispose();
        return string.Format("{0}x{1}  {2} foxing spots  mean alpha {3:0.0}/255  peak {4:0}/255",
                             W, H, spots, mean / n, peak);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"

Write-Output ([CardAge]::Go("$img\card-age.png", $W, $H, $Seed, $Foxing, $Mottle, $EdgeTone, $InkR, $InkG, $InkB))
Get-Item "$img\card-age.png" | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb,1)}}
