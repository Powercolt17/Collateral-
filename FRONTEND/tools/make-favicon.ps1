# Builds the favicon set: the wax seal, drawn rather than photographed.
#
#   powershell -File FRONTEND/tools/make-favicon.ps1
#
# ── SUPERSEDED. RUNNING THIS WILL OVERWRITE THE CURRENT FAVICON. ──────────────
# The shipped icons are now generated from a supplied PHOTOGRAPH of the seal
# (collateral_favicon_32x32_source.png), cropped to its red pixels at 129,51,538
# and rendered at 16/32/48/180. This script still draws the vector mark and will
# replace those files if it is run.
#
# The trade was measured before shipping, and the warning below is correct: on
# the photograph the C separates from the wax by 4.9-11.3 luma at 16px against
# roughly 150 for the drawn knockout. Contrast does not recover it — tested at
# 1.4, 1.8, 2.4 and 3.2, where separation went 8.8, 6.9, 6.1, 6.9, i.e. WORSE,
# because the C and the wax saturate together. It reads as a wine disc at tab
# size and as the real seal at 180.
#
# That was a design decision, not an oversight. Run this script to go back.
# ──────────────────────────────────────────────────────────────────────────────
#
# WHY THIS EXISTS. FRONTEND/favicon.ico was a JPEG with an .ico extension, and
# it sat in FRONTEND/ rather than FRONTEND/public/, so Vite never served it.
# /favicon.ico returned 404 and every browser fell back to its own default mark.
#
# WHY IT IS DRAWN AND NOT THE PHOTOGRAPH. The obvious move is to resize
# wax-seal-transparent-icon.png. It was tried and it fails, for a reason worth
# writing down: in that render the C is defined by EMBOSSING — a highlight on
# one edge and a shadow on the other, both in the same wine as the wax around
# them. Shrink it to 16px and those two thin tones average into their
# background, so the letter disappears and what is left is a pale pink blob. No
# amount of saturation or contrast recovers a letter that was never a colour
# difference to begin with; pushing it only made a browner blob.
#
# So the mark is redrawn from the same geometry, with the C as a real tonal
# hole rather than a relief: a scalloped wax disc in #7A2230, an impressed
# ring, and the C knocked out in parchment. It is the same object, built to
# survive being 16 pixels wide. The C is set in the brand's own Trajan Pro,
# read straight off the font file, so it is the wordmark's letterform.
#
# The apple-touch icon gets an opaque parchment ground — iOS composites those
# on black, and a transparent one would put a wine seal in a black tile.
#
# Emits: public/favicon.ico (16/32/48), public/favicon-32.png,
#        public/apple-touch-icon.png (180).

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Drawing.Imaging;

public class Favicon
{
    /* One mark, drawn at whatever size is asked for rather than scaled from a
       master, so the antialiasing is computed for the size it will be seen at. */
    public static Bitmap Draw(int S, string fontFile, bool opaqueGround)
    {
        var b = new Bitmap(S, S, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(b))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;

            if (opaqueGround)
                using (var ground = new SolidBrush(Color.FromArgb(255, 244, 239, 228)))
                    g.FillRectangle(ground, 0, 0, S, S);

            float c = S / 2f;
            float R = S * (opaqueGround ? 0.40f : 0.468f);

            /* Nine lobes, 5.2% deep. Enough to read as wax at 16px without
               turning the silhouette into a gear. */
            int N = 720;
            var pts = new PointF[N];
            for (int i = 0; i < N; i++)
            {
                double t = i * 2 * Math.PI / N;
                double r = R * (1 + 0.052 * Math.Cos(9 * t));
                pts[i] = new PointF((float)(c + r * Math.Cos(t)), (float)(c + r * Math.Sin(t)));
            }
            using (var wax = new SolidBrush(Color.FromArgb(255, 122, 34, 48)))
                g.FillPolygon(wax, pts);

            float ir = R * 0.758f;
            using (var pen = new Pen(Color.FromArgb(255, 96, 24, 36), Math.Max(1f, S * 0.018f)))
                g.DrawEllipse(pen, c - ir, c - ir, ir * 2, ir * 2);

            var pfc = new PrivateFontCollection();
            FontFamily fam = null;
            try { pfc.AddFontFile(fontFile); fam = pfc.Families[0]; } catch { }
            if (fam == null) fam = new FontFamily("Georgia");

            using (var path = new GraphicsPath())
            {
                path.AddString("C", fam, (int)FontStyle.Bold, R * 1.175f,
                               new PointF(0, 0), StringFormat.GenericTypographic);
                var rb = path.GetBounds();
                var m = new Matrix();
                m.Translate(c - (rb.X + rb.Width / 2f), c - (rb.Y + rb.Height / 2f));
                path.Transform(m);
                using (var ink = new SolidBrush(Color.FromArgb(255, 242, 233, 210)))
                    g.FillPath(ink, path);
            }
        }
        return b;
    }

    /* 32-bit BGRA DIB entries, not PNG-in-ICO.
     *
     * Browsers read PNG-in-ICO happily, and it was the first thing tried here.
     * GDI+ does not: Windows Explorer, the shell thumbnailer and anything built
     * on System.Drawing render such an icon as noise, which is both a bad look
     * for a file someone may open locally and a trap for whoever next tries to
     * verify this file and concludes it is corrupt. A DIB is understood by
     * everything, and at these sizes the format costs a couple of KB.
     *
     * DIB quirks that matter: the header height is DOUBLE the image (it
     * describes the colour bitmap plus an AND mask), rows are bottom-up, and
     * the AND mask still has to be present and 4-byte-row-aligned even though
     * the alpha channel is what actually carries transparency. */
    static byte[] Dib(Bitmap bm)
    {
        int S = bm.Width;
        int maskStride = ((S + 31) / 32) * 4;
        var data = new byte[40 + S * S * 4 + maskStride * S];
        using (var ms = new System.IO.MemoryStream(data))
        using (var w = new System.IO.BinaryWriter(ms))
        {
            w.Write(40); w.Write(S); w.Write(S * 2);
            w.Write((ushort)1); w.Write((ushort)32);
            w.Write(0); w.Write(S * S * 4);
            w.Write(0); w.Write(0); w.Write(0); w.Write(0);
            for (int y = S - 1; y >= 0; y--)
                for (int x = 0; x < S; x++)
                {
                    var p = bm.GetPixel(x, y);
                    w.Write(p.B); w.Write(p.G); w.Write(p.R); w.Write(p.A);
                }
            /* AND mask left zeroed: alpha does the work. */
        }
        return data;
    }

    public static void Ico(string dst, int[] sizes, string fontFile)
    {
        var blobs = new byte[sizes.Length][];
        for (int i = 0; i < sizes.Length; i++)
            using (var bm = Draw(sizes[i], fontFile, false))
                blobs[i] = Dib(bm);
        using (var fs = System.IO.File.Create(dst))
        using (var w = new System.IO.BinaryWriter(fs))
        {
            w.Write((ushort)0); w.Write((ushort)1); w.Write((ushort)sizes.Length);
            int offset = 6 + 16 * sizes.Length;
            for (int i = 0; i < sizes.Length; i++)
            {
                w.Write((byte)(sizes[i] >= 256 ? 0 : sizes[i]));
                w.Write((byte)(sizes[i] >= 256 ? 0 : sizes[i]));
                w.Write((byte)0); w.Write((byte)0);
                w.Write((ushort)1); w.Write((ushort)32);
                w.Write((uint)blobs[i].Length);
                w.Write((uint)offset);
                offset += blobs[i].Length;
            }
            foreach (var bl in blobs) w.Write(bl);
        }
    }
}
'@

$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pub  = "$root\FRONTEND\public"
$font = "$pub\trajan-pro-bold.otf"

[Favicon]::Ico("$pub\favicon.ico", @(16, 32, 48), $font)

$p32 = [Favicon]::Draw(32, $font, $false)
$p32.Save("$pub\favicon-32.png", [System.Drawing.Imaging.ImageFormat]::Png); $p32.Dispose()

$p180 = [Favicon]::Draw(180, $font, $true)
$p180.Save("$pub\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png); $p180.Dispose()

Get-ChildItem "$pub\favicon.ico", "$pub\favicon-32.png", "$pub\apple-touch-icon.png" |
    Select-Object Name, Length
