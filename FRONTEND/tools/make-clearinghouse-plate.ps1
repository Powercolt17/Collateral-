# Builds the /market hero plate from the supplied transparent original.
#
#   powershell -File FRONTEND/tools/make-clearinghouse-plate.ps1
#
# TWO OPERATIONS, AND THE FIRST IS WHY THIS SHIPS AS A JPEG.
#
# 1. FLATTEN ONTO THE PAGE'S CREAM. The source is a 2.9MB 32-bit RGBA PNG whose
#    transparency exists for exactly one purpose: to let the irregular dissolve
#    sit on a cream page. Compositing that cream in first bakes the dissolve into
#    the pixels, and there is then no rectangle to see, because the plate's
#    ground and the page's ground are the same value. No alpha needed, so no PNG
#    needed — 254KB instead of 2.9MB. Measured against the alternatives: PNG at
#    1400 is 1823KB, and pushing tone into an alpha channel over one flat sepia
#    got to 790KB but at a mean error of 17.75/255 over cream, which is visible.
#
# 2. DISSOLVE THE TOP EDGE. The original's architecture runs straight off the
#    top of its own canvas, so the plate has a hard horizontal cut along the top
#    — a rectangular asset boundary, exactly what the rest of the artwork is
#    drawn to avoid.
#
#    IT IS NOT A LINEAR FADE. A uniform gradient reads as a digital wipe laid
#    over an engraving; the plate's existing left edge dissolves as scattered
#    ink, and the top has to match it. So the mask is a NOISE FIELD THRESHOLDED
#    AGAINST DEPTH: at the very top almost every sample falls below the
#    threshold and the ink is dropped, and by the bottom of the band almost none
#    is. What survives in between is speckle, which is what a copperplate does
#    as the inked area runs out.
#
#    Two octaves at ~5px and ~19px, because one scale alone reads as either
#    television static or as blotches. The transition is softened over a narrow
#    band around the threshold so individual pixels are not binary — that is the
#    difference between stipple and noise.

param(
    [string]$Source   = "$env:USERPROFILE\Downloads\market-clearinghouse-transparent.png",
    [int]   $Width    = 1400,
    [double]$TopBand  = 0.14,   # fraction of height the dissolve spans
    [double]$Softness = 0.30,   # width of the per-pixel transition
    [double]$Fine     = 2.6,    # px, the grain octave
    [double]$Coarse   = 11.0,   # px, the clumping octave
    [int]   $Seed     = 4517,
    [long]  $Quality  = 90,
    [int]$CreamR = 241, [int]$CreamG = 232, [int]$CreamB = 211
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Plate
{
    static float C01(float v){ return v < 0f ? 0f : (v > 1f ? 1f : v); }
    static float S(float t){ t = C01(t); return t * t * (3f - 2f * t); }

    static float Hash(int x,int y,int seed){
        unchecked{
            int h = x * 374761393 + y * 668265263 + seed * 1274126177;
            h = (h ^ (h >> 13)) * 1274126177;
            return ((h ^ (h >> 16)) & 0x7fffffff) / 2147483647f;
        }
    }
    static float Value2(float x,float y,int seed){
        int xi=(int)Math.Floor(x), yi=(int)Math.Floor(y);
        float u=S(x-xi), v=S(y-yi);
        float a=Hash(xi,yi,seed),   b=Hash(xi+1,yi,seed);
        float c=Hash(xi,yi+1,seed), d=Hash(xi+1,yi+1,seed);
        return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
    }

    public static string Go(string src,string dst,int tw,double band,double soft,
                            double fine,double coarse,int seed,
                            long q,int cr,int cg,int cb)
    {
        var o = new Bitmap(src);
        int th = (int)Math.Round(o.Height * (double)tw / o.Width);

        var b = new Bitmap(tw, th, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(b)) {
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            g.Clear(Color.FromArgb(255, cr, cg, cb));   // the page's cream, first
            g.DrawImage(o, new Rectangle(0, 0, tw, th));
        }
        o.Dispose();

        int bandPx = (int)(th * band);
        var rect = new Rectangle(0, 0, tw, th);
        var d = b.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var buf = new byte[d.Stride * th];
        Marshal.Copy(d.Scan0, buf, 0, buf.Length);

        long touched = 0, cleared = 0;
        for (int y = 0; y < bandPx; y++)
        {
            /* 1 at the very top of the band, 0 at its lower edge. Eased so the
               dissolve thins gradually rather than ending on a line. */
            float depth = 1f - S(y / (float)bandPx);
            for (int x = 0; x < tw; x++)
            {
                float n = Value2(x / (float)fine,   y / (float)fine,   seed)      * 0.62f
                        + Value2(x / (float)coarse, y / (float)coarse, seed + 77) * 0.38f;
                /* keep = how much ink survives here. Above the threshold it
                   stays, below it goes, and the soft window turns what would be
                   a binary cut into grain. */
                float keep = C01(((n - depth) / (float)soft) * 0.5f + 0.5f);

                int i = y * d.Stride + x * 4;
                if (keep >= 0.999f) continue;
                touched++;
                if (keep <= 0.001f) cleared++;
                buf[i]     = (byte)Math.Round(buf[i]     * keep + cb * (1 - keep));
                buf[i + 1] = (byte)Math.Round(buf[i + 1] * keep + cg * (1 - keep));
                buf[i + 2] = (byte)Math.Round(buf[i + 2] * keep + cr * (1 - keep));
            }
        }
        Marshal.Copy(buf, 0, d.Scan0, buf.Length);
        b.UnlockBits(d);

        ImageCodecInfo jp = null;
        foreach (var e in ImageCodecInfo.GetImageEncoders()) if (e.MimeType == "image/jpeg") jp = e;
        var ps = new EncoderParameters(1);
        ps.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, q);
        b.Save(dst, jp, ps);
        b.Dispose();

        return string.Format("{0}x{1}  top dissolve over {2}px  {3} px softened, {4} fully cleared",
                             tw, th, bandPx, touched, cleared);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dst  = "$root\FRONTEND\public\assets\images\market-clearinghouse.jpg"

if (-not (Test-Path $Source)) { throw "source plate not found: $Source" }

Write-Output ([Plate]::Go($Source, $dst, $Width, $TopBand, $Softness, $Fine, $Coarse, $Seed, $Quality, $CreamR, $CreamG, $CreamB))
Get-Item $dst | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb,1)}}
