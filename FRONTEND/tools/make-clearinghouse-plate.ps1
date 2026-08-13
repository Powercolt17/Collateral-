# Builds the /market hero plate from the supplied engraving.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File FRONTEND/tools/make-clearinghouse-plate.ps1
#
# THE SUPPLIED PLATE IS AN OPAQUE RECTANGLE WITH ITS OWN PAPER. It carries a
# printed parchment ground, a vignette that darkens every corner, and a tone
# that is cooler and darker than the page it has to sit on. Dropped in as-is it
# reads as a photograph of an engraving pasted onto the site — a visible box on
# all four sides. Everything below exists to turn that rectangle back into ink
# lying on THIS page's paper.
#
# 1. DIVIDE OUT THE PLATE'S OWN PAPER. Ink on paper is multiplicative — a stroke
#    transmits some fraction of whatever it is printed on — so the way to move
#    ink from one paper to another is to divide by the old and multiply by the
#    new, not to subtract or to tint. The old paper is estimated per tile as a
#    high percentile of each channel (paper is the bright end of the histogram,
#    and it still shows between strokes even in dense architecture), then
#    bilinearly interpolated so the estimate varies smoothly and never draws a
#    grid. Dividing by that estimate removes the vignette and the tone shift in
#    one operation, because both are exactly what a slowly varying paper term
#    describes.
#
#    THE DIVISION ALONE IS NOT ENOUGH. The estimate is smooth by construction,
#    so the source's parchment MOTTLING survives in the ratio — and against a
#    page that is perfectly flat cream, that mottling reads as a stain in the
#    exact shape of the asset. A white point clears it: every ratio within 6% of
#    its local paper is snapped to clean paper, which empties the ground without
#    touching a stroke, because a stroke is far darker than that.
#
#    AND THE INK HAS TO BE PUT BACK. Dividing each channel by its own paper term
#    strips the warm cast off the STROKES as well as off the ground, and the
#    plate comes back grey-blue where the source was sepia. Collapsing the three
#    ratios toward one achromatic ratio makes the ink a darkened version of this
#    page's cream — which is what a sepia engraving on warm paper is — with
#    `chroma` holding back a little of the source's own variation and `sepia`
#    deepening blue absorption.
#
#    Verified on the output: all four corners and both mid-edges land within one
#    point of #F1E8D3, and columns 0-25% carry 0.0% ink, which is what the CSS
#    relies on when it crops the plate's left edge and overlaps the copy column.
#
# 2. DISSOLVE THE TOP AND BOTTOM EDGES. The architecture runs off the top of the
#    canvas and the paving runs off the bottom, so both are hard cuts. The right
#    edge is deliberately left alone — it bleeds past the viewport. The left is
#    already drawn as a dissolve.
#
#    IT IS NOT A LINEAR FADE. A uniform gradient reads as a digital wipe laid
#    over an engraving. The mask is a NOISE FIELD THRESHOLDED AGAINST DEPTH: at
#    the outer edge almost every sample falls below the threshold and the ink is
#    dropped, and by the inner edge of the band almost none is. What survives in
#    between is speckle, which is what a copperplate does as the inked area runs
#    out — and it matches the character of the plate's own left edge. Two octaves,
#    because one scale alone reads as either television static or as blotches.
#
# 3. FLATTEN TO JPEG. After step 1 the ground IS the page's cream, so there is
#    no alpha to carry and no boundary to hide, and the file is ~250KB instead of
#    the source's 3MB.

param(
    [string]$Source    = "$env:USERPROFILE\Downloads\63ee1290-27a3-4952-b105-194bc6b88496.png",
    [int]   $Width     = 1400,
    [int]   $Tile      = 44,     # px, paper-estimate tile
    [double]$Pct       = 0.94,   # percentile within a tile taken to be paper
    [double]$White     = 0.94,   # ratios at/above this are snapped to clean paper
    [double]$Chroma    = 0.18,   # how much of the source ink's own colour to keep
    [double]$Sepia     = 0.26,   # blue absorption; higher = warmer ink
    [double]$TopBand   = 0.13,   # fraction of height dissolved at the top
    [double]$BotBand   = 0.09,   # ...and at the bottom
    [double]$Softness  = 0.30,   # width of the per-pixel transition
    [double]$Fine      = 2.6,    # px, the grain octave
    [double]$Coarse    = 11.0,   # px, the clumping octave
    [int]   $Seed      = 4517,
    [long]  $Quality   = 90,
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
    /* Static fields rather than a local function: Add-Type in Windows
       PowerShell 5.1 compiles against an old C# and local functions are C# 7. */
    static float[] _paper; static int _tx, _ty, _tile;

    static float PaperAt(int x,int y,int ch){
        float fx = (x - _tile * 0.5f) / _tile, fy = (y - _tile * 0.5f) / _tile;
        int x0 = (int)Math.Floor(fx), y0 = (int)Math.Floor(fy);
        float u = fx - x0, v = fy - y0;
        int xa = Math.Min(Math.Max(x0,0), _tx-1), xb = Math.Min(Math.Max(x0+1,0), _tx-1);
        int ya = Math.Min(Math.Max(y0,0), _ty-1), yb = Math.Min(Math.Max(y0+1,0), _ty-1);
        float p00 = _paper[(ya*_tx+xa)*3+ch], p10 = _paper[(ya*_tx+xb)*3+ch];
        float p01 = _paper[(yb*_tx+xa)*3+ch], p11 = _paper[(yb*_tx+xb)*3+ch];
        return (p00*(1-u)+p10*u)*(1-v) + (p01*(1-u)+p11*u)*v;
    }

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

    public static string Go(string src,string dst,int tw,int tile,double pct,double white,double chroma,double sepia,
                            double topBand,double botBand,double soft,
                            double fine,double coarse,int seed,
                            long q,int cr,int cg,int cb)
    {
        var o = new Bitmap(src);
        int srcW = o.Width, srcH = o.Height;
        int th = (int)Math.Round(srcH * (double)tw / srcW);

        var b = new Bitmap(tw, th, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(b)) {
            g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            g.Clear(Color.FromArgb(255, cr, cg, cb));
            g.DrawImage(o, new Rectangle(0, 0, tw, th));
        }
        o.Dispose();

        var rect = new Rectangle(0, 0, tw, th);
        var d = b.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var buf = new byte[d.Stride * th];
        Marshal.Copy(d.Scan0, buf, 0, buf.Length);

        /* ---- 1. estimate the plate's own paper, per tile, per channel ---- */
        int tx = (tw + tile - 1) / tile, ty = (th + tile - 1) / tile;
        var paper = new float[tx * ty * 3];
        _paper = paper; _tx = tx; _ty = ty; _tile = tile;
        var bucket = new byte[tile * tile];
        for (int gy = 0; gy < ty; gy++)
        for (int gx = 0; gx < tx; gx++)
        {
            int x0 = gx * tile, y0 = gy * tile;
            int x1 = Math.Min(x0 + tile, tw), y1 = Math.Min(y0 + tile, th);
            for (int ch = 0; ch < 3; ch++)
            {
                int n = 0;
                for (int y = y0; y < y1; y++)
                for (int x = x0; x < x1; x++)
                    bucket[n++] = buf[y * d.Stride + x * 4 + ch];
                Array.Sort(bucket, 0, n);
                int idx = (int)(n * pct); if (idx >= n) idx = n - 1;
                /* floored, so a tile that is almost solid ink cannot divide by a
                   near-zero paper term and blow the contrast out */
                paper[(gy * tx + gx) * 3 + ch] = Math.Max(40f, bucket[idx]);
            }
        }

        var cream = new int[]{ cb, cg, cr };   // BGRA order
        int topPx = (int)(th * topBand), botPx = (int)(th * botBand);
        long dissolved = 0;

        for (int y = 0; y < th; y++)
        {
            /* depth: 1 at the outer edge of a band, 0 at its inner edge */
            float depth = 0f;
            if (y < topPx)          depth = 1f - S(y / (float)topPx);
            else if (y >= th-botPx) depth = 1f - S((th - 1 - y) / (float)botPx);

            for (int x = 0; x < tw; x++)
            {
                int i = y * d.Stride + x * 4;

                /* ---- divide out the old paper, multiply in the new ----
                   The white point matters as much as the division. Dividing
                   alone leaves the source's parchment MOTTLING in the ratio,
                   and against a page that is perfectly flat cream that mottling
                   reads as a stain in the shape of the asset. Snapping every
                   ratio within `white` of paper up to clean paper clears the
                   empty ground without touching a stroke, because a stroke is
                   far darker than 6% below its own paper. Per channel and
                   uniform, so it cannot tint. */
                float rB = C01(buf[i  ] / PaperAt(x,y,0) / (float)white);
                float rG = C01(buf[i+1] / PaperAt(x,y,1) / (float)white);
                float rR = C01(buf[i+2] / PaperAt(x,y,2) / (float)white);

                /* ONE INK, TIED TO THE PAPER. Dividing each channel by its own
                   paper term strips the warm cast off the STROKES as well as
                   off the ground, and the plate comes back grey-blue where the
                   source was sepia. Collapsing the three ratios toward a single
                   achromatic one makes the ink a darkened version of this page's
                   cream — which is what a sepia engraving on warm paper is —
                   while `chroma` keeps a little of the source's own variation so
                   it does not go flat. `sepia` then deepens blue absorption and
                   eases red, which is the direction real iron-gall and bistre
                   inks sit. */
                float rl = 0.299f*rR + 0.587f*rG + 0.114f*rB;
                float ch2 = (float)chroma;
                rR = rl + (rR - rl) * ch2;
                rG = rl + (rG - rl) * ch2;
                rB = rl + (rB - rl) * ch2;
                rB = (float)Math.Pow(C01(rB), 1.0 + sepia);
                rR = (float)Math.Pow(C01(rR), 1.0 - sepia * 0.35);

                int vB = (int)Math.Round(cream[0] * rB);
                int vG = (int)Math.Round(cream[1] * rG);
                int vR = (int)Math.Round(cream[2] * rR);
                buf[i  ] = (byte)(vB < 0 ? 0 : (vB > 255 ? 255 : vB));
                buf[i+1] = (byte)(vG < 0 ? 0 : (vG > 255 ? 255 : vG));
                buf[i+2] = (byte)(vR < 0 ? 0 : (vR > 255 ? 255 : vR));

                /* ---- 2. dissolve the top and bottom bands ---- */
                if (depth <= 0f) continue;
                float n2 = Value2(x/(float)fine,   y/(float)fine,   seed)      * 0.62f
                         + Value2(x/(float)coarse, y/(float)coarse, seed + 77) * 0.38f;
                float keep = C01(((n2 - depth) / (float)soft) * 0.5f + 0.5f);
                if (keep >= 0.999f) continue;
                dissolved++;
                for (int ch = 0; ch < 3; ch++)
                    buf[i+ch] = (byte)Math.Round(buf[i+ch] * keep + cream[ch] * (1 - keep));
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

        return string.Format("src {0}x{1} -> {2}x{3} | paper grid {4}x{5} @p{6:F2} | dissolve {7}px top, {8}px bottom, {9} px touched",
                             srcW, srcH, tw, th, tx, ty, pct, topPx, botPx, dissolved);
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dst  = "$root\FRONTEND\public\assets\images\market-clearinghouse.jpg"

if (-not (Test-Path $Source)) { throw "source plate not found: $Source" }

Write-Output ([Plate]::Go($Source, $dst, $Width, $Tile, $Pct, $White, $Chroma, $Sepia, $TopBand, $BotBand,
                          $Softness, $Fine, $Coarse, $Seed, $Quality, $CreamR, $CreamG, $CreamB))
Get-Item $dst | Select-Object Name, @{n='KB';e={[math]::Round($_.Length/1kb,1)}}
