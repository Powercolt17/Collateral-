# Generates the alpha masks that dissolve the two fork plates into the
# parchment. Consumed by FRONTEND/src/components/ForkSection.js — see the note
# on .fk-plate there for how the two are used.
#
#   plate-<name>-mask.png   the sharp layer. Alpha 1 across the whole interior,
#                           falling to 0 through an irregular boundary.
#   plate-<name>-edge.png   the blurred layer. A bump, zero at both ends of the
#                           transition, which is what keeps the blur off the
#                           engraving itself. Downsampled to half — it only ever
#                           feeds a 4px blur, so it needs no detail.
#
# Re-run after replacing either plate. Output is sized to the 1000x666 frame;
# move W/H below together with the images if that frame ever changes.
#
#   powershell -File FRONTEND/tools/gen-plate-masks.ps1
#
# No Node or Python on the Windows box this was written on, hence System.Drawing
# and an inline C# type — a per-pixel loop in PowerShell itself is far too slow
# at 666k pixels a mask.

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class PlateMask
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
        float sum = 0f, amp = 0.5f, freq = 1f, norm = 0f;
        for (int i = 0; i < oct; i++) {
            sum += amp * Value2(x * freq, y * freq, seed + i * 101);
            norm += amp; freq *= 2f; amp *= 0.5f;
        }
        return sum / norm;
    }

    static float Clamp01(float v) { return v < 0f ? 0f : (v > 1f ? 1f : v); }

    /* Depth of the dissolve at one point along one edge. Two octaves on a very
       long period, contrast-stretched, then gamma'd: the result is two or three
       broad ZONES per edge rather than a ripple. Multiplier runs 0.08x to about
       2x, so a nominal 60px edge is nearly crisp in places and dissolves 120px
       in others. That range is the whole point — an even feather is what this
       is trying not to be. */
    static float DepthAt(float t, float base_, int seed)
    {
        float n = Fbm(t / 330f, 0.5f, seed, 2);
        n = Clamp01((n - 0.18f) / 0.64f);
        return base_ * (0.08f + 1.95f * (float)Math.Pow(n, 1.5));
    }

    static float Ramp(float d, float depth)
    {
        if (depth <= 1f) return 1f;
        return S(Clamp01(d / depth));
    }

    public static void Build(int W, int H, int seed,
                             float bL, float bR, float bT, float bB,
                             int cornerA, int cornerB,
                             string maskPath, string edgePath)
    {
        var mask = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        var edge = new Bitmap(W, H, PixelFormat.Format32bppArgb);
        var r = new Rectangle(0, 0, W, H);
        var md = mask.LockBits(r, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var ed = edge.LockBits(r, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        int stride = md.Stride;
        byte[] mb = new byte[stride * H];
        byte[] eb = new byte[stride * H];

        float cr = 215f;
        for (int y = 0; y < H; y++)
        {
            int row = y * stride;
            for (int x = 0; x < W; x++)
            {
                /* The contour is displaced before it is ramped, so the boundary
                   itself wanders at a ~30px scale. Ramping a straight edge, no
                   matter how the depth varies, still leaves a straight edge;
                   this is what stops it reading as a rectangle. Each side gets
                   its own noise so the four are uncorrelated. */
                float jL = 24f * (Fbm(x / 30f, y / 30f, seed + 201, 3) - 0.5f) * 2f;
                float jR = 24f * (Fbm(x / 30f, y / 30f, seed + 211, 3) - 0.5f) * 2f;
                float jT = 24f * (Fbm(x / 30f, y / 30f, seed + 221, 3) - 0.5f) * 2f;
                float jB = 24f * (Fbm(x / 30f, y / 30f, seed + 231, 3) - 0.5f) * 2f;

                float al = Ramp(x + jL,         DepthAt(y, bL, seed + 11));
                float ar = Ramp(W - 1 - x + jR, DepthAt(y, bR, seed + 23));
                float at = Ramp(y + jT,         DepthAt(x, bT, seed + 37));
                float ab = Ramp(H - 1 - y + jB, DepthAt(x, bB, seed + 53));

                float a = Math.Min(Math.Min(al, ar), Math.Min(at, ab));

                /* Two corners per plate are pulled much further open than the
                   min() of two edges would do on its own. Which two differs
                   between the plates so the pair never reads as one stamp. */
                for (int k = 0; k < 2; k++)
                {
                    int corner = (k == 0) ? cornerA : cornerB;
                    float cx = ((corner & 1) == 0) ? 0 : W - 1;
                    float cy = ((corner & 2) == 0) ? 0 : H - 1;
                    float dx = x - cx, dy = y - cy;
                    float dist = (float)Math.Sqrt(dx * dx + dy * dy);
                    a *= 0.02f + 0.98f * S(Clamp01(dist / cr));
                }

                float open = 1f - a;   /* 0 in the interior, so everything below
                                          this line leaves the engraving alone */

                /* Ink bled further out in places and fell short in others. This
                   moves the boundary itself rather than dimming it. */
                float bloom = Fbm(x / 145f, y / 145f, seed + 71, 3) - 0.5f;
                a = Clamp01(a + 0.42f * bloom * (4f * a * open));

                open = 1f - a;

                /* Pigment loss and paper abrasion: mid-frequency mottling that
                   only bites where the ink is already thinning. */
                float loss = Fbm(x / 52f, y / 52f, seed + 97, 4);
                a *= 1f - 0.50f * loss * open;

                /* Dry-brush breakup at the very outside — broken lines, not a
                   smooth ramp. Weighted to the last third of the transition. */
                float grit = Fbm(x / 6f, y / 6f, seed + 131, 2);
                float outer = Clamp01((0.70f - a) / 0.70f);
                a *= 1f - 0.62f * grit * outer * outer;

                a = Clamp01(a);

                /* The blur layer lives only in the transition band: a bump that
                   is zero where the plate is solid and zero where it is gone,
                   so the engraving proper is never blurred. */
                float band = 0.40f * (4f * a * (1f - a));

                int i = row + x * 4;
                mb[i] = 0; mb[i + 1] = 0; mb[i + 2] = 0;
                mb[i + 3] = (byte)(a * 255f + 0.5f);
                eb[i] = 0; eb[i + 1] = 0; eb[i + 2] = 0;
                eb[i + 3] = (byte)(Clamp01(band) * 255f + 0.5f);
            }
        }
        Marshal.Copy(mb, 0, md.Scan0, mb.Length);
        Marshal.Copy(eb, 0, ed.Scan0, eb.Length);
        mask.UnlockBits(md); edge.UnlockBits(ed);
        mask.Save(maskPath, ImageFormat.Png);
        edge.Save(edgePath, ImageFormat.Png);
        mask.Dispose(); edge.Dispose();
    }
}
'@

$dst = "C:\Users\CarterLoesch\Documents\GitHub\Collateral-\FRONTEND\public\assets\images"

# corner ids: 0=TL 1=TR 2=BL 3=BR
# solo    — shallow top, deep right, deep bottom; TL and BR open up
[PlateMask]::Build(1000, 666, 1607, 34, 76, 22, 58, 0, 3,
    "$dst\plate-solo-mask.png", "$dst\plate-solo-edge.png")
# rivalry — deep left, shallow right, deep top; TR and BL open up
[PlateMask]::Build(1000, 666, 4211, 68, 26, 52, 30, 1, 2,
    "$dst\plate-rivalry-mask.png", "$dst\plate-rivalry-edge.png")

# The edge masks only ever feed a blur, so they ship at half resolution.
foreach ($n in @("plate-solo-edge", "plate-rivalry-edge")) {
    $src = [System.Drawing.Image]::FromFile("$dst\$n.png")
    $b = New-Object System.Drawing.Bitmap(500, 333, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($b)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
    $g.DrawImage($src, 0, 0, 500, 333); $g.Dispose(); $src.Dispose()
    $b.Save("$dst\$n.png", [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}

Get-ChildItem "$dst\plate-*-mask.png","$dst\plate-*-edge.png" | Select-Object Name,Length
