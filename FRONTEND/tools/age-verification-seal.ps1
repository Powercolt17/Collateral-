# Re-cuts the verification-sources wax seal to aged sealing wax.
#
#   powershell -File FRONTEND/tools/age-verification-seal.ps1
#
# THE SEAL WAS CANDY-RED, AND THAT IS A MEASUREMENT RATHER THAN AN OPINION.
# Sampled on the deployed PNG across every pixel with alpha > 200 and saturation
# > 25% (i.e. the wax, excluding the plate shadow):
#
#   mean colour        rgb(204,43,49)   against a target of rgb(94,20,32)
#   median saturation  85%              near the top of the gamut
#   median red         217
#   red p95            255              CLIPPING at pure red
#
# A channel pinned at 255 has no highlight information left in it — the wax
# reads as a flat saturated blob because the brightest 5% of it is literally
# the same colour. That is what made it the loudest thing on a page built out
# of restraint, and no amount of resizing was ever going to fix it.
#
# The previous pass raised a 1.58x gain to bring the wax out of a dim plate.
# That was the right instinct on a dark original and it overshot: it moved the
# highlights past the clipping point rather than to it.
#
# WHAT THIS DOES, in HSV so hue survives the operation:
#
#   VALUE   v^1.18 * 0.60. The gamma is the important half — a flat multiply
#           crushes the shadows and the wax loses the depth that makes it look
#           pressed. Raising v to a power above 1 first pulls the highlights
#           down harder than the midtones, which is exactly the specular gloss
#           the brief asks to remove, and then the multiply seats the whole
#           thing at aged-wax luminance.
#   SAT     s * 0.97, i.e. essentially untouched, AND THE FIRST ATTEMPT HAD
#           THIS WRONG. "Aged wax" sounds like it should be less saturated, so
#           the first pass scaled it to 0.78 and landed on rgb(118,44,52) — too
#           pink and still too light. Checking the TARGET instead of assuming:
#           #5E1420 is S = (94-20)/94 = 79%, and the photograph measured 79% as
#           well. The two colours already agreed on saturation. The entire
#           difference between them was value: 0.80 against 0.37.
#   HUE     blended 45% toward 350 degrees, the hue of #5E1420. The photograph
#           sits at ~358, which is a fire-engine red; the house oxblood is a
#           wine. Eight degrees is invisible as a hue shift and is most of the
#           difference between the two readings.
#
# ALPHA IS NEVER TOUCHED. The edge was already re-cut once — mask eroded 2px,
# no alpha floor — and that work is good. This pass only rewrites RGB where
# alpha > 0, so the outline, the feather and the shape are bit-identical.
#
# The original is copied to wax-seal-verification.src.png on first run and read
# from there afterwards, so re-running is idempotent rather than compounding.

param(
    [double]$ValueGamma = 1.18,
    [double]$ValueGain  = 0.48,
    [double]$SatScale   = 0.97,
    [double]$HueTarget  = 350.0,
    [double]$HueBlend   = 0.45
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class SealAge
{
    static void ToHsv(double r, double g, double b, out double h, out double s, out double v)
    {
        double mx = Math.Max(r, Math.Max(g, b)), mn = Math.Min(r, Math.Min(g, b));
        v = mx; double d = mx - mn;
        s = mx <= 0 ? 0 : d / mx;
        if (d <= 0) { h = 0; return; }
        if (mx == r)      h = 60 * (((g - b) / d) % 6);
        else if (mx == g) h = 60 * (((b - r) / d) + 2);
        else              h = 60 * (((r - g) / d) + 4);
        if (h < 0) h += 360;
    }
    static void ToRgb(double h, double s, double v, out double r, out double g, out double b)
    {
        double c = v * s, x = c * (1 - Math.Abs(((h / 60) % 2) - 1)), m = v - c;
        double rr, gg, bb;
        if (h < 60)       { rr = c; gg = x; bb = 0; }
        else if (h < 120) { rr = x; gg = c; bb = 0; }
        else if (h < 180) { rr = 0; gg = c; bb = x; }
        else if (h < 240) { rr = 0; gg = x; bb = c; }
        else if (h < 300) { rr = x; gg = 0; bb = c; }
        else              { rr = c; gg = 0; bb = x; }
        r = rr + m; g = gg + m; b = bb + m;
    }
    /* shortest-path blend between two hues on the circle */
    static double BlendHue(double from, double to, double t)
    {
        double d = ((to - from + 540) % 360) - 180;
        double h = from + d * t;
        return (h % 360 + 360) % 360;
    }

    public static string Go(string src, string dst, double vGamma, double vGain,
                            double sScale, double hTarget, double hBlend)
    {
        var bmp = new Bitmap(src);
        var work = new Bitmap(bmp.Width, bmp.Height, PixelFormat.Format32bppArgb);
        using (var gfx = Graphics.FromImage(work)) { gfx.DrawImage(bmp, 0, 0); }
        bmp.Dispose();

        var rect = new Rectangle(0, 0, work.Width, work.Height);
        var data = work.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var buf = new byte[data.Stride * work.Height];
        Marshal.Copy(data.Scan0, buf, 0, buf.Length);

        long n = 0; double sr = 0, sg = 0, sb = 0;
        var sats = new System.Collections.Generic.List<double>();
        var lums = new System.Collections.Generic.List<double>();

        for (int i = 0; i < buf.Length; i += 4)
        {
            byte a = buf[i + 3];
            if (a == 0) continue;
            double b0 = buf[i] / 255.0, g0 = buf[i + 1] / 255.0, r0 = buf[i + 2] / 255.0;

            double h, s, v;
            ToHsv(r0, g0, b0, out h, out s, out v);

            v = Math.Pow(v, vGamma) * vGain;
            s = s * sScale;
            if (s > 0.02) h = BlendHue(h, hTarget, hBlend);
            if (v > 1) v = 1;

            double r1, g1, b1;
            ToRgb(h, s, v, out r1, out g1, out b1);

            buf[i]     = (byte)Math.Round(Math.Max(0, Math.Min(1, b1)) * 255);
            buf[i + 1] = (byte)Math.Round(Math.Max(0, Math.Min(1, g1)) * 255);
            buf[i + 2] = (byte)Math.Round(Math.Max(0, Math.Min(1, r1)) * 255);

            /* report over the same population the problem was measured on */
            if (a > 200 && s / Math.Max(sScale, 1e-6) > 0.25)
            {
                n++; sr += buf[i + 2]; sg += buf[i + 1]; sb += buf[i];
                sats.Add(s * 100);
                lums.Add(0.2126 * buf[i + 2] + 0.7152 * buf[i + 1] + 0.0722 * buf[i]);
            }
        }

        Marshal.Copy(buf, 0, data.Scan0, buf.Length);
        work.UnlockBits(data);
        work.Save(dst, ImageFormat.Png);
        work.Dispose();

        sats.Sort(); lums.Sort();
        double medS = sats.Count > 0 ? sats[sats.Count / 2] : 0;
        double medL = lums.Count > 0 ? lums[lums.Count / 2] : 0;
        double p95L = lums.Count > 0 ? lums[(int)(lums.Count * 0.95)] : 0;

        return string.Format(
            "wax px {0}  mean rgb({1:0},{2:0},{3:0})  median sat {4:0}%  median luma {5:0}  luma p95 {6:0}",
            n, sr / n, sg / n, sb / n, medS, medL, p95L);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img  = "$root\FRONTEND\public\assets\images"
$live = "$img\wax-seal-verification.png"
# The pristine original lives in tools/, NOT in public/assets — it is a build
# input, and anything under public/ ships. Keeping it here also means the script
# always reads the un-aged source, so running it twice gives the same result
# rather than compounding the darkening.
$src  = "$root\FRONTEND\tools\wax-seal-verification.src.png"

if (-not (Test-Path $src)) { Copy-Item $live $src }

Write-Output ([SealAge]::Go($src, $live, $ValueGamma, $ValueGain, $SatScale, $HueTarget, $HueBlend))
Write-Output "target: mean rgb(94,20,32)  median sat ~60-66%"
Get-Item $live | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb,1)}}
