# Generates the paper texture for the Performance Contract card.
#
#   powershell -File FRONTEND/tools/make-card-age.ps1
#
# THIS SCRIPT USED TO MAKE PAPER LOOK OLD. IT NOW MAKES PAPER LOOK GOOD, and
# that is a deliberate reversal rather than a dialling-down.
#
# The reasoning: the Roman engraving beside this card already supplies every bit
# of historical atmosphere the hero needs. When the contract is ALSO foxed and
# edge-toned, the two read as the same artefact and the idea collapses. The
# concept only works on the CONTRAST — a precise, institutional, present-tense
# document set against a classical engraving. So the document should feel
# OFFICIAL, not ANCIENT: the modern descendant of that tradition, not another
# object dug out of the same drawer.
#
# What was removed:
#   FOXING       rust-brown speckle. The single strongest "this sheet is 200
#                years old" cue, and as scattered floating spots it was also the
#                least premium thing on the card. Gone entirely.
#   EDGE TONING  the oxidised perimeter. Same problem: it says decay. Gone.
#
# What replaces them, all three things a GOOD sheet of stock has today:
#   COTTON FIBRE broad-direction filaments, from anisotropic noise stretched
#                ~9:1 and then crossed with its own transpose. Real cotton rag
#                has fibres running both ways at unequal density; a single
#                direction reads as brushed metal, and isotropic noise reads as
#                digital grain.
#   PRESS MARK   the faint debossed line an intaglio plate leaves inset from the
#                trimmed edge. It is the mark of a sheet that went through a
#                press under pressure — the reason banknotes, share certificates
#                and letterpress stationery carry one — and it is pure quality
#                signal with no age in it at all. Softened and made slightly
#                uneven so it is an impression rather than a drawn border.
#   TONAL DRIFT  gentle, very-low-frequency variation. No sheet is one flat
#                value; this is what stops the card reading as #FDF9F0.
#
# Emitted as ALPHA over one neutral warm grey — NOT the old brown, which was a
# stain colour. The CSS multiplies it, so it modulates the paper it already has
# rather than painting a new one. Cap .13, against .34 before: the whole point
# is that this is felt and not seen.

param(
    [int]$W = 500,
    [int]$H = 820,
    [int]$Seed = 20641,
    [double]$Fibre = 0.085,
    [double]$Press = 0.10,
    [double]$Tonal = 0.055,
    [double]$PressInset = 13.0,
    [int]$InkR = 128, [int]$InkG = 116, [int]$InkB = 96
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
                            double fibre, double press, double tonal, double inset,
                            int ir, int ig, int ib)
    {
        var bmp = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        var d = bmp.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * H];

        for (int y = 0; y < H; y++)
            for (int x = 0; x < W; x++)
            {
                float al = 0;

                /* COTTON FIBRE. Two anisotropic fields at ~9:1, crossed, at
                   unequal weight — a sheet has a grain direction, so the two
                   are not balanced. Centred on zero so fibres both lighten and
                   darken; only the darkening survives into alpha, which is
                   correct, since a fibre catching light is the paper itself. */
                float fx = Fbm(x / 1.5f, y / 13f, seed + 3, 2) - 0.5f;
                float fy = Fbm(x / 13f, y / 1.5f, seed + 61, 2) - 0.5f;
                al += (float)fibre * C01(fx * 1.25f + fy * 0.75f + 0.5f) * 2f - (float)fibre * 0.5f;

                /* TONAL DRIFT. One broad field, gently biased so most of the
                   sheet is clean and a few areas sit a shade deeper. */
                float t = Fbm(x / 260f, y / 320f, seed + 7, 2);
                al += (float)tonal * S((t - 0.42f) / 0.55f);

                /* PRESS MARK. Distance to the nearest edge, and a soft band
                   centred on the inset — an impression, not a stroke. The
                   inset itself wanders by a pixel or so along its length, the
                   way a real plate mark does; a perfectly parallel line reads
                   as a CSS border. */
                float dx = Math.Min(x, W - 1 - x), dy = Math.Min(y, H - 1 - y);
                float dist = Math.Min(dx, dy);
                float wob = (Fbm(x / 70f, y / 70f, seed + 131, 2) - 0.5f) * 2.2f;
                float band = 1f - S(Math.Abs(dist - ((float)inset + wob)) / 2.6f);
                al += (float)press * band;

                /* Just inside the mark the sheet is very slightly compressed,
                   so it holds a touch more tone. Half the strength, three times
                   the width — this is what makes it read as pressure rather
                   than as a second hairline. */
                if (dist > inset)
                    al += (float)press * 0.28f * (1f - S((dist - (float)inset) / 9f));

                int o = y * d.Stride + x * 4;
                a[o + 2] = (byte)ir; a[o + 1] = (byte)ig; a[o] = (byte)ib;
                a[o + 3] = (byte)(Math.Min(C01(al), 0.13f) * 255f + 0.5f);
            }

        Marshal.Copy(a, 0, d.Scan0, a.Length);
        bmp.UnlockBits(d);
        bmp.Save(dst, ImageFormat.Png);

        double mean = 0; long n = 0; float peak = 0;
        for (int i = 3; i < a.Length; i += 4) { mean += a[i]; n++; if (a[i] > peak) peak = a[i]; }
        bmp.Dispose();
        return string.Format("{0}x{1}  mean alpha {2:0.0}/255 ({3:0.0}%)  peak {4:0}/255 ({5:0.0}%)",
                             W, H, mean / n, mean / n / 2.55, peak, peak / 2.55);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"

Write-Output ([CardAge]::Go("$img\card-age.png", $W, $H, $Seed, $Fibre, $Press, $Tonal, $PressInset, $InkR, $InkG, $InkB))
Get-Item "$img\card-age.png" | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb,1)}}
