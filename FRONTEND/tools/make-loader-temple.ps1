# Builds the loading screen's temple from the fork section's step emblem.
#
# The emblem is drawn on its own cream ground. Placed on the loading screen as-is
# it shows a rectangle: the ground is a different cream from #F4EFE4, and
# mix-blend-mode:multiply darkens it rather than hiding it. So the ink is lifted
# onto a transparent ground instead — alpha from how dark each pixel is, colour
# replaced with a flat warm sepia. It then sits on any background with no edge at
# all, which is what "printed onto the page" needs.
#
# It is also CROPPED. The source emblem carries a short rule above the temple as
# part of its design; alone on a loading screen that reads as a stray artifact
# rather than as ornament, so the ink bounding box is taken from below the top
# 18% and the art is trimmed to it.
#
# Output is 2x the 136px display width so it holds up on retina.
#
#   powershell -File FRONTEND/tools/make-loader-temple.ps1

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class LoaderTemple
{
    public static string Go(string src, string dst, int W, float strength,
                            int inkR, int inkG, int inkB)
    {
        var s = new Bitmap(src);
        var sd = s.LockBits(new Rectangle(0, 0, s.Width, s.Height),
                            ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var sa = new byte[sd.Stride * s.Height];
        Marshal.Copy(sd.Scan0, sa, 0, sa.Length);
        s.UnlockBits(sd);

        /* Ink bounding box, ignoring the top 18% where the source rule lives. */
        int y0 = (int)(s.Height * 0.18);
        int minX = s.Width, maxX = 0, minY = s.Height, maxY = 0;
        for (int y = y0; y < s.Height; y++)
            for (int x = 0; x < s.Width; x++)
            {
                int i = y * sd.Stride + x * 4;
                float L = 0.2126f * sa[i + 2] + 0.7152f * sa[i + 1] + 0.0722f * sa[i];
                if (L < 205)
                {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        int pad = 6;
        minX = Math.Max(0, minX - pad); minY = Math.Max(0, minY - pad);
        maxX = Math.Min(s.Width - 1, maxX + pad); maxY = Math.Min(s.Height - 1, maxY + pad);
        int cw = maxX - minX + 1, ch = maxY - minY + 1;
        int H = (int)Math.Round(W * (double)ch / cw);

        var o = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(o))
        {
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
            g.DrawImage(s, new Rectangle(0, 0, W, H), minX, minY, cw, ch, GraphicsUnit.Pixel);
        }
        s.Dispose();

        var d = o.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var a = new byte[d.Stride * H];
        Marshal.Copy(d.Scan0, a, 0, a.Length);

        /* Paper is the 97th percentile, so the ground lands on fully clear. */
        int[] h = new int[256];
        for (int i = 0; i < a.Length; i += 4)
        {
            int L = (int)(0.2126 * a[i + 2] + 0.7152 * a[i + 1] + 0.0722 * a[i]);
            if (L > 255) L = 255;
            h[L]++;
        }
        long n = (long)W * H, c = 0; int paper = 255;
        for (int i = 0; i < 256; i++) { c += h[i]; if (c >= (long)(n * 0.97)) { paper = i; break; } }

        for (int i = 0; i < a.Length; i += 4)
        {
            float L = 0.2126f * a[i + 2] + 0.7152f * a[i + 1] + 0.0722f * a[i];
            float t = L / (float)paper; if (t > 1) t = 1; if (t < 0) t = 0;
            float al = (1f - t) * strength; if (al > 1) al = 1;
            a[i + 2] = (byte)inkR; a[i + 1] = (byte)inkG; a[i] = (byte)inkB;
            a[i + 3] = (byte)(al * 255f + 0.5f);
        }
        Marshal.Copy(a, 0, d.Scan0, a.Length);
        o.UnlockBits(d);
        o.Save(dst, ImageFormat.Png);
        o.Dispose();
        return string.Format("crop {0},{1} {2}x{3} -> {4}x{5}, paper L={6}",
                             minX, minY, cw, ch, W, H, paper);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$img = "$root\FRONTEND\public\assets\images"
[LoaderTemple]::Go("$img\fork-step-01.png", "$img\loader-temple.png", 272, 0.82, 74, 58, 40)
Get-Item "$img\loader-temple.png" | Select-Object Name, Length
