# Re-grades the two fork plates from their original sources into a light line
# engraving printed on the section's parchment.
#
# The sources are dark painterly washes: highlights top out around L=195 and the
# median sits near 100, so the paper INSIDE the engraving reads as dull tan and
# the drawing reads as a photograph of a drawing. The comp wants ink on paper.
#
# What the curve does, in order:
#   1. normalise between measured black and white points, so the source's
#      washed-out 195 highlight becomes a true 1.0
#   2. an S-curve about a low pivot, which is what actually separates the wash
#      into "paper" and "ink" rather than lifting everything into grey
#   3. a mild gamma lift on top
#   4. colourise the result along a single ramp from warm ink to the EXACT
#      --fk-parch value, so the lightest areas of the engraving are literally
#      the same colour as the page behind it. This is what makes the dissolve
#      seamless; no mask can hide a background two shades off.
#
# Monochrome by construction. The sources are near-monochrome sepia already and
# the comp has no colour in it.
#
#   powershell -File FRONTEND/tools/grade-plates.ps1

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Grade
{
    static float Clamp01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }

    public static void Go(string inPath, string outPath, int W, int H,
                          float black, float white, float pivot, float contrast,
                          float gamma,
                          int inkR, int inkG, int inkB,
                          int papR, int papG, int papB)
    {
        var src = new Bitmap(inPath);

        /* Resize first, into the shared frame. */
        var img = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(img))
        {
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
            float tgt = (float)W / H, r = (float)src.Width / src.Height;
            int cw, ch;
            if (r > tgt) { ch = src.Height; cw = (int)Math.Round(ch * tgt); }
            else { cw = src.Width; ch = (int)Math.Round(cw / tgt); }
            g.DrawImage(src, new Rectangle(0, 0, W, H),
                        (src.Width - cw) / 2, (src.Height - ch) / 2, cw, ch, GraphicsUnit.Pixel);
        }
        src.Dispose();

        var d = img.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        byte[] a = new byte[d.Stride * H];
        Marshal.Copy(d.Scan0, a, 0, a.Length);

        for (int y = 0; y < H; y++)
        {
            int row = y * d.Stride;
            for (int x = 0; x < W; x++)
            {
                int i = row + x * 4;
                float L = (0.2126f * a[i + 2] + 0.7152f * a[i + 1] + 0.0722f * a[i]) / 255f;

                float u = Clamp01((L - black) / (white - black));
                float t = Clamp01((u - pivot) * contrast + pivot);
                t = (float)Math.Pow(t, gamma);

                a[i + 2] = (byte)(inkR + (papR - inkR) * t + 0.5f);
                a[i + 1] = (byte)(inkG + (papG - inkG) * t + 0.5f);
                a[i]     = (byte)(inkB + (papB - inkB) * t + 0.5f);
                a[i + 3] = 255;
            }
        }
        Marshal.Copy(a, 0, d.Scan0, a.Length);
        img.UnlockBits(d);

        ImageCodecInfo jpg = null;
        foreach (var c in ImageCodecInfo.GetImageEncoders()) if (c.MimeType == "image/jpeg") jpg = c;
        var ep = new EncoderParameters(1);
        ep.Param[0] = new EncoderParameter(Encoder.Quality, 88L);
        img.Save(outPath, jpg, ep);
        img.Dispose();
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dst = "$root\FRONTEND\public\assets\images"
# Sources live under tools/, NOT under public/ — anything in public/ is served.
$src = "$root\FRONTEND\tools\sources"

# ink #3C2E1E, paper #F2E9D2 — the paper value is --fk-parch exactly.
# black/white points come from the measured p1 and p99 of each source.
[Grade]::Go("$src\solo-source.jpg",    "$dst\plate-solo.jpg",    1000, 666,
            0.055, 0.765, 0.38, 1.70, 0.80,  60, 46, 30,  242, 233, 210)
[Grade]::Go("$src\rivalry-source.jpg", "$dst\plate-rivalry.jpg", 1000, 666,
            0.075, 0.760, 0.38, 1.70, 0.80,  60, 46, 30,  242, 233, 210)

Get-ChildItem "$dst\plate-solo.jpg","$dst\plate-rivalry.jpg" | Select-Object Name,Length
