"""Fill the HackSprint template with the Network Flight Recorder project content."""
import copy
from lxml import etree
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_MARKER_STYLE
from pptx.chart.data import CategoryChartData
from pptx.oxml.ns import qn

# ---- Template palette (from the HackSprint cover) + two signal colours from the app ----
TEAL = RGBColor(0x00, 0x49, 0x44)       # template dark teal: headings, body
TEAL_MID = RGBColor(0x0E, 0x7C, 0x84)   # readable accent text on white
CYAN = RGBColor(0x5D, 0xE0, 0xE6)       # template title cyan: fills only
CYAN_TINT = RGBColor(0xE4, 0xF8, 0xF9)
INK = RGBColor(0x1E, 0x33, 0x32)
MUTED = RGBColor(0x4E, 0x66, 0x64)
LINE = RGBColor(0xBF, 0xDD, 0xDF)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
AMBER = RGBColor(0xA8, 0x6E, 0x1B)      # darkened app amber for text on white
RED = RGBColor(0xB5, 0x43, 0x2F)
GREEN = RGBColor(0x3E, 0x7A, 0x4E)
FONT = 'Arial'

L, R = 1.12, 18.88          # content left/right edges (template title inset)
W = R - L

prs = Presentation('base.pptx')
S = prs.slides


# ------------------------------------------------------------------ helpers
def set_alpha(shape, alpha_pct):
    """Fill transparency (python-pptx has no API for it)."""
    srgb = shape.fill._xPr.find(qn('a:solidFill')).find(qn('a:srgbClr'))
    a = etree.SubElement(srgb, qn('a:alpha'))
    a.set('val', str(int(alpha_pct * 1000)))


def box(slide, x, y, w, h, fill=WHITE, line=LINE, alpha=None, radius=0.06, dash=False, line_w=1.0, shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    sp = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        sp.adjustments[0] = radius
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = fill
        if alpha is not None:
            set_alpha(sp, alpha)
    if line is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line
        sp.line.width = Pt(line_w)
        if dash:
            sp.line.dash_style = MSO_LINE.DASH
    sp.shadow.inherit = False
    sp.text_frame.text = ''
    return sp


def text(slide, x, y, w, h, paras, size=16, color=INK, bold=False, italic=False, font=FONT,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, space_after=0, line_spacing=None):
    """paras: str | list of str | list of list-of-runs; a run = (text, {overrides})."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    if isinstance(paras, str):
        paras = [paras]
    for i, p in enumerate(paras):
        para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        para.alignment = align
        if space_after:
            para.space_after = Pt(space_after)
        if line_spacing:
            para.line_spacing = line_spacing
        runs = p if isinstance(p, list) else [(p, {})]
        for t, o in runs:
            r = para.add_run()
            r.text = t
            f = r.font
            f.name = o.get('font', font)
            f.size = Pt(o.get('size', size))
            f.bold = o.get('bold', bold)
            f.italic = o.get('italic', italic)
            f.color.rgb = o.get('color', color)
    return tb


def bullets(slide, x, y, w, h, items, size=16, color=INK, gap=8, marker_color=TEAL_MID):
    """Bulleted list with real paragraph bullets (no literal glyphs)."""
    tb = text(slide, x, y, w, h, [[(it, {})] if isinstance(it, str) else it for it in items], size=size, color=color, space_after=gap)
    for para in tb.text_frame.paragraphs:
        pPr = para._p.get_or_add_pPr()
        pPr.set('marL', str(Inches(0.3)))
        pPr.set('indent', str(-Inches(0.3)))
        clr = etree.SubElement(pPr, qn('a:buClr'))
        etree.SubElement(clr, qn('a:srgbClr')).set('val', str(marker_color))
        etree.SubElement(pPr, qn('a:buFont')).set('typeface', 'Arial')
        etree.SubElement(pPr, qn('a:buChar')).set('char', '▪')
    return tb


def arrow(slide, x1, y1, x2, y2, color=TEAL_MID, width=1.5, dash=False, kind=MSO_CONNECTOR.STRAIGHT):
    c = slide.shapes.add_connector(kind, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = color
    c.line.width = Pt(width)
    if dash:
        c.line.dash_style = MSO_LINE.DASH
    ln = c.line._get_or_add_ln()
    te = etree.SubElement(ln, qn('a:tailEnd'))
    te.set('type', 'triangle')
    te.set('w', 'med')
    te.set('len', 'med')
    return c


def badge(slide, x, y, d, label, fill=CYAN, color=TEAL, size=14):
    sp = box(slide, x, y, d, d, fill=fill, line=None, shape=MSO_SHAPE.OVAL)
    tf = sp.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name, r.font.size, r.font.bold, r.font.color.rgb = FONT, Pt(size), True, color
    return sp


def set_title(slide, new_text, width=W):
    for sh in slide.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip():
            sh.text_frame.paragraphs[0].runs[0].text = new_text
            sh.width = Inches(width)
            return sh
    raise RuntimeError('no title')


def picture(slide, path, x, y, w=None, h=None, border=True):
    pic = slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w) if w else None, Inches(h) if h else None)
    if border:
        pic.line.color.rgb = RGBColor(0x2A, 0x3A, 0x39)
        pic.line.width = Pt(1)
    return pic


def pill(slide, x, y, w, label, h=0.34):
    box(slide, x, y, w, h, fill=WHITE, line=None, alpha=92, radius=0.5)
    text(slide, x, y + 0.04, w, h - 0.06, label, size=12, italic=True, color=TEAL, align=PP_ALIGN.CENTER)


def footnote(slide, msg, y=10.55):
    text(slide, L, y, W, 0.35, msg, size=12, color=MUTED, italic=True)


# ================================================================== 2 · Solution
s = S[1]
text(s, L, 3.0, 10.4, 0.7, 'Network Flight Recorder', size=40, bold=True, color=TEAL)
text(s, L, 3.85, 10.4, 0.6, 'See the attack before it becomes the incident.', size=26, italic=True, color=TEAL_MID, font='Times New Roman')
text(s, L, 4.65, 10.2, 1.4,
     'An investigation workstation for security analysts. It learns how every host, address and protocol normally '
     'behaves, flags when that behavior drifts, and replays the sequence second by second — with every score explained.',
     size=18, color=INK, line_spacing=1.1)

card = box(s, 12.2, 1.0, R - 12.2, 5.0, alpha=92)
text(s, 12.6, 1.3, 5.9, 0.4, 'THE PROBLEM', size=13, bold=True, color=RED)
text(s, 12.6, 1.7, 5.9, 1.5, 'Alert tools say that something fired, not how it developed. Analysts rebuild timelines '
     'by hand from scattered logs, and a black-box score earns little trust.', size=17, color=INK, line_spacing=1.05)
text(s, 12.6, 3.25, 5.9, 0.4, 'OUR APPROACH', size=13, bold=True, color=TEAL_MID)
text(s, 12.6, 3.65, 5.9, 2.2, 'Behavior instead of signatures, chronology instead of snapshots, and evidence instead '
     'of verdicts: every flag decomposes into named factors with the observed value and the baseline.', size=17, color=INK, line_spacing=1.05)

steps = [
    ('Normal behavior', '7-day baseline per entity, matched to the same hours of day'),
    ('Behavioral deviation', 'Live flows measured in σ against that envelope'),
    ('Anomaly detection', 'Deviation that persists, or meets a novel destination'),
    ('Event correlation', 'Signals on one entity in one time window are linked'),
    ('Attack timeline', 'Sequence rebuilt second by second, routine traffic kept'),
    ('Explainable investigation', 'Score split into named factors with their evidence'),
]
cw, gap, cy, ch = 2.7, (W - 6 * 2.7) / 5, 6.55, 3.05
for i, (name, desc) in enumerate(steps):
    x = L + i * (cw + gap)
    box(s, x, cy, cw, ch, alpha=94)
    badge(s, x + 0.25, cy + 0.28, 0.62, f'{i + 1:02d}', fill=CYAN if i < 5 else TEAL, color=TEAL if i < 5 else WHITE)
    text(s, x + 0.25, cy + 1.12, cw - 0.45, 0.95, name, size=18, bold=True, color=TEAL)
    text(s, x + 0.25, cy + 2.0, cw - 0.45, 1.0, desc, size=14, color=MUTED, line_spacing=1.05)
    if i < 5:
        arrow(s, x + cw + 0.03, cy + ch / 2, x + cw + gap - 0.03, cy + ch / 2, width=1.75)
footnote(s, 'All telemetry in this build is simulated — the frontend demonstrates the workflow and performs no real threat detection.', y=10.05)

# ================================================================== 3 · INC-2047 replay
s = S[2]
set_title(s, 'INC-2047 Replay')
text(s, L, 2.98, 17.0, 0.9,
     [[('Demo scenario: ', {'bold': True, 'color': TEAL}),
       ('finance workstation ws-fin-014 (10.24.18.42) starts checking in with a never-seen domain every 4 seconds, '
        'then reads 412 MB from a file server. Replay window: 30 Sep 2026, 10:40–10:47 UTC.', {})]],
     size=17, color=INK)


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


FACT = [(32, 151, 40), (21, 182, 10), (17, 197, 115), (12, 220, 25)]


def score(t):
    s_ = sum(m * smooth((t - st) / rp) for m, st, rp in FACT)
    n = 8.0
    return max(n * (1 - smooth(s_ / 20)), s_, n * 0.6)


times = list(range(0, 421, 10))
labels = [f'10:{40 + t // 60:02d}:{t % 60:02d}' for t in times]
cd = CategoryChartData()
cd.categories = labels
cd.add_series('Deviation score', [round(score(t), 1) for t in times])
cd.add_series('Incident threshold (70)', [70] * len(times))

box(s, L, 4.05, 10.75, 6.3, alpha=94)
gf = s.shapes.add_chart(XL_CHART_TYPE.LINE, Inches(L + 0.25), Inches(4.2), Inches(10.25), Inches(6.0), cd)
ch_ = gf.chart
ch_.has_title = True
ch_.chart_title.text_frame.text = 'Deviation score crosses the incident threshold at 10:44'
tp = ch_.chart_title.text_frame.paragraphs[0]
tp.runs[0].font.size, tp.runs[0].font.bold, tp.runs[0].font.color.rgb, tp.runs[0].font.name = Pt(16), True, TEAL, FONT
ch_.has_legend = True
ch_.legend.position = XL_LEGEND_POSITION.BOTTOM
ch_.legend.include_in_layout = False
ch_.legend.font.size, ch_.legend.font.color.rgb, ch_.legend.font.name = Pt(12), MUTED, FONT
plot = ch_.plots[0]
for ser, col, w_, dash in [(plot.series[0], TEAL_MID, 2.75, False), (plot.series[1], RED, 1.5, True)]:
    ser.smooth = False
    ser.marker.style = XL_MARKER_STYLE.NONE
    ser.format.line.color.rgb = col
    ser.format.line.width = Pt(w_)
    if dash:
        ser.format.line.dash_style = MSO_LINE.DASH
va = ch_.value_axis
va.minimum_scale, va.maximum_scale, va.major_unit = 0, 100, 20
va.has_major_gridlines = True
va.major_gridlines.format.line.color.rgb = RGBColor(0xE2, 0xEC, 0xEC)
va.format.line.fill.background()
va.tick_labels.font.size, va.tick_labels.font.color.rgb, va.tick_labels.font.name = Pt(12), MUTED, FONT
ca = ch_.category_axis
ca.tick_labels.font.size, ca.tick_labels.font.color.rgb, ca.tick_labels.font.name = Pt(12), MUTED, FONT
ca.format.line.color.rgb = LINE
cat_ax = ca._element
for tag in ('c:tickLblSkip', 'c:tickMarkSkip'):
    el = etree.Element(qn(tag))
    el.set('val', '6')
    nm = cat_ax.find(qn('c:noMultiLvlLbl'))
    if nm is not None:
        nm.addprevious(el)
    else:
        cat_ax.append(el)

px, pw = 12.2, R - 12.2
box(s, px, 4.05, pw, 6.3, alpha=94)
phases = [
    ('10:40:00', 'NORMAL', GREEN, 'Traffic inside the 7-day baseline'),
    ('10:42:31', 'DEVIATION', AMBER, 'Outbound rate 4.1/min vs 1.2 baseline'),
    ('10:43:02', 'ANOMALY', AMBER, 'First contact: cdn-sync.example on 8443/tcp'),
    ('10:43:17', 'CORRELATION', AMBER, 'Check-ins lock to 4.0 s ± 0.15 s'),
    ('10:44:05', 'ESCALATION', RED, 'Periodic-egress match; 412 MB SMB read'),
    ('10:45:12', 'INCIDENT', RED, 'Score 82 / 100 · confidence 0.82'),
]
ry = 4.3
for t_, name, col, line in phases:
    text(s, px + 0.35, ry, 1.35, 0.35, t_, size=14, bold=True, color=TEAL, font='Courier New')
    text(s, px + 1.85, ry, 4.4, 0.35, name, size=14, bold=True, color=col)
    text(s, px + 1.85, ry + 0.38, 4.5, 0.55, line, size=13, color=INK)
    ry += 1.0
footnote(s, 'Score 82 = outbound frequency +32 · destination novelty +21 · periodic timing +17 · unusual port +12. '
            'Scores are scripted demo values, not output of a trained model.', y=10.6)

# ================================================================== 4 · Key features
s = S[3]
set_title(s, 'Key Features')
feats = [
    ('—', 'Landing page', 'What is this product?', 'Auto-playing, scrubbable replay of INC-2047'),
    ('01', 'Security Overview', 'What is abnormal right now?', 'Zoomable network map, live event stream, 24h density'),
    ('02', 'Flight Recorder', 'How did the incident develop?', 'Drag a cursor: graph, events, score and explanation move together'),
    ('03', 'Investigation', 'Why was it flagged?', 'Reconstruction timeline + factor breakdown + analyst notes'),
    ('04', 'Behavioral Analysis', 'What moved from baseline?', 'Deviation matrix and six-dimension fingerprint'),
    ('05', 'Event Timeline', 'What is the full record?', 'Filters, search, time-range brush, j/k keys'),
    ('06', 'Network Entities', 'What do we know about each entity?', 'Sortable table with profile side panel'),
    ('07', 'Detection Details', 'Is the detection logic sound?', 'Four reasoning steps with evidence charts'),
    ('08', 'Investigation Report', 'What goes to stakeholders?', 'Seven-section forensic document, PDF export'),
    ('09', 'Settings', 'How is it configured?', 'Thresholds, sources, retention, backend status'),
]
cw, gap = (W - 4 * 0.3) / 5, 0.3
for i, (num, name, q, what) in enumerate(feats):
    col, row = i % 5, i // 5
    x, y = L + col * (cw + gap), 3.0 + row * 3.5
    box(s, x, y, cw, 3.2, alpha=94)
    text(s, x + 0.28, y + 0.28, 1.0, 0.35, num, size=14, bold=True, color=TEAL_MID, font='Courier New')
    text(s, x + 0.28, y + 0.7, cw - 0.5, 0.9, name, size=19, bold=True, color=TEAL)
    text(s, x + 0.28, y + 1.55, cw - 0.5, 0.75, q, size=14, italic=True, color=TEAL_MID)
    text(s, x + 0.28, y + 2.2, cw - 0.5, 0.95, what, size=14, color=MUTED, line_spacing=1.05)
footnote(s, 'Keyboard-first: 1–9 jump between sections · Space plays the replay · j / k move through rows · ? lists every shortcut.', y=10.25)

# ================================================================== 5 · Tech stack
s = S[4]
text(s, L, 4.9, 7.9, 0.5, 'Engineering choices', size=22, bold=True, color=TEAL)
bullets(s, L, 5.55, 7.9, 5.0, [
    [('One data hook. ', {'bold': True, 'color': TEAL}), ('Every page reads through useResource(key) — switching to FastAPI is one setting, not ten pages.', {})],
    [('Deterministic demo data. ', {'bold': True, 'color': TEAL}), ('Seeded telemetry renders the same story on every run.', {})],
    [('Hand-built SVG visuals. ', {'bold': True, 'color': TEAL}), ('Network graph, recorder strip and baseline charts — no chart library.', {})],
    [('Reusable components. ', {'bold': True, 'color': TEAL}), ('NetworkGraph, RecorderStrip, Timeline, EventStream, EntityTable, DetectionPanel.', {})],
    [('Resilient UI. ', {'bold': True, 'color': TEAL}), ('Responsive from 768 to 1440 px; an error boundary contains page failures.', {})],
], size=16, gap=12)

stack = [
    ('React 19', 'Component UI, hooks, context state'),
    ('Vite 8', 'Dev server, hot reload, ~139 KB gzipped build'),
    ('Tailwind CSS 4', 'Design tokens defined once in @theme'),
    ('React Router 7', '10 routes, deep links with ?id='),
    ('JavaScript (ES modules)', 'Plain JS, as the brief required'),
    ('lucide-react', 'Minimal interface glyphs'),
    ('Custom SVG', 'Graph, replay strip, evidence charts'),
    ('FastAPI · planned', '/api/events, /entities, /incidents, /behavior, /detections, /timeline'),
]
gx, gw, gh, gg = 9.75, (R - 9.75 - 0.3) / 2, 2.12, 0.3
for i, (name, role) in enumerate(stack):
    col, row = i % 2, i // 2
    x, y = gx + col * (gw + gg), 1.0 + row * (gh + gg)
    planned = 'planned' in name
    box(s, x, y, gw, gh, fill=WHITE, alpha=94, dash=planned, line=TEAL_MID if planned else LINE, line_w=1.25 if planned else 1.0)
    text(s, x + 0.3, y + 0.32, gw - 0.6, 0.5, name, size=20, bold=True, color=TEAL)
    text(s, x + 0.3, y + 0.95, gw - 0.6, 1.0, role, size=15, color=MUTED, line_spacing=1.05)

# ================================================================== 6 · Architecture (template's untitled slide)
s = S[5]
src_title = next(sh for sh in S[4].shapes if sh.has_text_frame and sh.text_frame.text.strip())
el = copy.deepcopy(src_title._element)
el.find('.//' + qn('p:cNvPr')).set('id', '901')
el.find('.//' + qn('p:cNvPr')).set('name', 'Title Architecture')
s.shapes._spTree.append(el)
set_title(s, 'Architecture')

# Layer 1: pages
box(s, L, 2.85, W, 1.55, alpha=95)
text(s, L + 0.35, 3.05, 12, 0.45, 'Pages · 10 routes in src/pages, rendered inside AppShell', size=19, bold=True, color=TEAL)
text(s, L + 0.35, 3.6, W - 0.7, 0.7, 'Landing · Overview · Flight Recorder · Investigation · Behavior · Timeline · Entities · Detection · Report · Settings   —   shell adds sidebar, top bar, shortcuts, error boundary',
     size=14, color=MUTED)

# Layer 2: components / data hook / state
lw, lg, ly, lh = (W - 2 * 0.45) / 3, 0.45, 5.25, 2.55
layer2 = [
    ('Shared components', 'src/components', ['NetworkGraph · RecorderStrip', 'Timeline · EventStream', 'EntityTable · DetectionPanel', 'BehaviorChart · FilterBar']),
    ('useResource(key)', 'src/api', ['Serves bundled demo data today', 'Calls /api/* once VITE_API_BASE is set', 'Falls back to demo data on failure']),
    ('AppState', 'src/state', ['Simulated clock (UTC)', 'Analyst preferences in localStorage', 'Shortcut overlay, mobile navigation']),
]
centers = []
for i, (name, path, lines) in enumerate(layer2):
    x = L + i * (lw + lg)
    accent = i == 1
    box(s, x, ly, lw, lh, fill=CYAN_TINT if accent else WHITE, line=TEAL_MID if accent else LINE, line_w=2 if accent else 1, alpha=None if accent else 95)
    text(s, x + 0.3, ly + 0.25, lw - 0.6, 0.45, [[(name, {'bold': True, 'color': TEAL, 'size': 19}), ('   ' + path, {'color': MUTED, 'size': 13})]])
    bullets(s, x + 0.3, ly + 0.85, lw - 0.6, lh - 1.0, lines, size=14, gap=4)
    centers.append(x + lw / 2)
    arrow(s, x + lw / 2, 4.4, x + lw / 2, ly, width=1.5)
for cx, lbl, pw_ in zip(centers, ['renders', 'reads data', 'reads clock & prefs'], [1.0, 1.25, 2.0]):
    pill(s, cx + 0.15, 4.65, pw_, lbl)

# Layer 3: data sources
dy, dh, dw = 8.65, 1.65, 5.3
hook_cx = centers[1]
demo_x, api_x = hook_cx - dw - 0.4, hook_cx + 0.4
box(s, demo_x, dy, dw, dh, alpha=95)
text(s, demo_x + 0.3, dy + 0.22, dw - 0.6, 0.45, [[('Demo telemetry', {'bold': True, 'color': TEAL, 'size': 18}), ('   src/data', {'color': MUTED, 'size': 13})]])
text(s, demo_x + 0.3, dy + 0.78, dw - 0.6, 0.8, 'INC-2047 replay · 109 events · entities · incidents · behavioral baselines', size=13, color=MUTED)
box(s, api_x, dy, dw, dh, alpha=95, dash=True, line=TEAL_MID, line_w=1.25)
text(s, api_x + 0.3, dy + 0.22, dw - 0.6, 0.45, [[('FastAPI backend', {'bold': True, 'color': TEAL, 'size': 18}), ('   planned', {'color': MUTED, 'size': 13, 'italic': True})]])
text(s, api_x + 0.3, dy + 0.78, dw - 0.6, 0.8, 'events · entities · incidents · behavior · detections · timeline', size=13, color=MUTED)
arrow(s, hook_cx - 0.3, ly + lh, demo_x + dw / 2, dy, width=1.5, kind=MSO_CONNECTOR.STRAIGHT)
arrow(s, hook_cx + 0.3, ly + lh, api_x + dw / 2, dy, width=1.5, dash=True, kind=MSO_CONNECTOR.STRAIGHT)
pill(s, demo_x + dw / 2 + 0.9, 8.05, 0.85, 'today')
pill(s, api_x + dw / 2 - 3.3, 8.05, 2.55, 'when VITE_API_BASE is set')

# ================================================================== 7 · Data flow diagram
s = S[6]
text(s, L, 2.95, 17.5, 0.5, 'How telemetry becomes an explained incident — the pipeline the frontend is built to display.', size=17, color=INK)
stages = [
    ('Telemetry sources', 'Zeek conn / dns / smb, NetFlow, directory auth, endpoint agent, reputation feed'),
    ('Behavior model', '7-day rolling baseline per entity, same hours of day'),
    ('Deviation scoring', 'σ per dimension: rate, destinations, ports, timing, volume, protocols'),
    ('Correlator', 'Links signals on one entity within a 15-minute window'),
    ('Incidents & detections', 'Score = sum of named factors, plus confidence'),
    ('FastAPI  /api/*', 'events · entities · incidents · behavior · detections · timeline'),
]
sw, sg, sy, sh_ = 2.62, (W - 6 * 2.62) / 5, 3.7, 2.65
scx = []
for i, (name, desc) in enumerate(stages):
    x = L + i * (sw + sg)
    api = i == 5
    box(s, x, sy, sw, sh_, fill=CYAN_TINT if api else WHITE, line=TEAL_MID if api else LINE, line_w=1.75 if api else 1, alpha=None if api else 95)
    badge(s, x + 0.22, sy + 0.22, 0.5, str(i + 1), size=13)
    text(s, x + 0.22, sy + 0.85, sw - 0.4, 0.8, name, size=16, bold=True, color=TEAL)
    text(s, x + 0.22, sy + 1.6, sw - 0.4, 1.1, desc, size=12, color=MUTED, line_spacing=1.05)
    scx.append(x + sw / 2)
    if i < 5:
        arrow(s, x + sw + 0.04, sy + sh_ / 2, x + sw + sg - 0.04, sy + sh_ / 2, width=1.75)

# Data stores (retention from Settings)
stores = [(0, 'Raw flow records', 'kept 14 days'), (3, 'Events & detections', 'kept 90 days'), (4, 'Incidents & reports', 'kept 1 year')]
st_y, st_h = 6.95, 1.3
for idx, name, ret in stores:
    x = L + idx * (sw + sg)
    can = box(s, x + 0.1, st_y, sw - 0.2, st_h, fill=WHITE, line=TEAL_MID, shape=MSO_SHAPE.CAN, alpha=95)
    text(s, x + 0.25, st_y + 0.45, sw - 0.5, 0.4, name, size=13, bold=True, color=TEAL, align=PP_ALIGN.CENTER)
    text(s, x + 0.25, st_y + 0.85, sw - 0.5, 0.35, ret, size=12, color=MUTED, align=PP_ALIGN.CENTER)
    arrow(s, scx[idx], sy + sh_, scx[idx], st_y, width=1.25, dash=True)

# Frontend
fx, fy, fw, fh = 9.25, 8.9, R - 9.25, 1.5
box(s, fx, fy, fw, fh, fill=CYAN_TINT, line=TEAL_MID, line_w=1.75)
text(s, fx + 0.3, fy + 0.2, fw - 0.6, 0.45, 'React frontend (this project)', size=17, bold=True, color=TEAL)
text(s, fx + 0.3, fy + 0.72, fw - 0.6, 0.75, 'Overview · Flight Recorder · Investigation · Behavior · Timeline · Entities · Detection · Report', size=13, color=INK)
arrow(s, scx[5], sy + sh_, scx[5], fy, width=1.75)
pill(s, scx[5] - 0.45, 7.4, 0.9, 'JSON')

box(s, L, 8.9, 7.75, 1.5, alpha=92)
text(s, L + 0.3, 9.1, 7.2, 1.2,
     [[('In this build: ', {'bold': True, 'color': RED}),
       ('stages 1–5 are simulated in src/data with seeded, deterministic telemetry. The frontend already reads them '
        'through useResource exactly as it will read /api/*.', {})]], size=14, color=INK, line_spacing=1.05)

# ================================================================== 8 · Screenshot: overview
s = S[7]
set_title(s, 'Screenshot of Your Project')
img_w = 12.4
picture(s, 'shots/overview.jpg', L, 2.75, w=img_w)
cx_ = L + img_w + 0.45
box(s, cx_, 2.75, R - cx_, 7.75, alpha=94)
text(s, cx_ + 0.35, 3.05, R - cx_ - 0.7, 0.5, 'Security Overview', size=22, bold=True, color=TEAL)
text(s, cx_ + 0.35, 3.6, R - cx_ - 0.7, 0.4, 'What is abnormal right now?', size=15, italic=True, color=TEAL_MID)
bullets(s, cx_ + 0.35, 4.3, R - cx_ - 0.7, 6.0, [
    'Behavioral activity map: critical entities in red, deviating flows in amber, normal traffic stays quiet',
    'Zoom, pan and select an entity to open its profile in place',
    'Time window 15 min – 24 h filters the flows shown',
    'Live event stream with severity and confidence on every event',
    'Open investigations, largest deviations and sensor posture below',
], size=16, gap=12)

# ================================================================== 9 · Screenshot: flight recorder
s = S[8]
set_title(s, 'Flight Recorder')
pic_h = W / (2076 / 770)
picture(s, 'shots/recorder_crop.jpg', L, 2.6, w=W)
cap_y = 2.6 + pic_h + 0.35
caps = [
    ('Phase rail', 'Six phases from Normal to Incident; click one to jump straight to it.'),
    ('Replay strip', 'One lane per entity, one tick per flow. Ahead of the cursor stays dimmed.'),
    ('Synchronized panels', 'Graph, event list, score and explanation all follow the cursor.'),
]
cw3 = (W - 2 * 0.4) / 3
for i, (h, b) in enumerate(caps):
    x = L + i * (cw3 + 0.4)
    box(s, x, cap_y, cw3, 10.75 - cap_y, alpha=94)
    text(s, x + 0.3, cap_y + 0.15, cw3 - 0.6, 0.4, h, size=16, bold=True, color=TEAL)
    text(s, x + 0.3, cap_y + 0.55, cw3 - 0.6, 0.7, b, size=13, color=MUTED)

# ================================================================== 10 · Screenshot: investigation + detection
s = S[9]
set_title(s, 'Investigation & Detection')
iw = (W - 0.45) / 2
ih = iw * 1500 / 2400
for i, (img, h, b) in enumerate([
    ('shots/investigation.jpg', 'Incident Investigation', 'Metadata, a chronological reconstruction with raw records, and “Why was this flagged?” — the 82/100 score split into four factors.'),
    ('shots/detection.jpg', 'Detection Details', 'Four reasoning steps, each with observed vs baseline values and an evidence chart, plus confidence composition and counter-evidence checks.'),
]):
    x = L + i * (iw + 0.45)
    picture(s, img, x, 2.65, w=iw)
    box(s, x, 2.65 + ih + 0.3, iw, 1.75, alpha=94)
    text(s, x + 0.3, 2.65 + ih + 0.45, iw - 0.6, 0.4, h, size=17, bold=True, color=TEAL)
    text(s, x + 0.3, 2.65 + ih + 0.9, iw - 0.6, 0.9, b, size=14, color=MUTED)

# ================================================================== 11 · Others
s = S[10]
stats = [('10', 'screens: landing page plus nine workspace sections'),
         ('15', 'bugs found and fixed in a scripted debug pass'),
         ('109', 'simulated events in the forensic log'),
         ('4', 'viewport widths verified (768–1440 px), no overflow')]
sw2, sh2 = 4.2, 2.75
for i, (num, lbl) in enumerate(stats):
    col, row = i % 2, i // 2
    x, y = L + col * (sw2 + 0.35), 2.85 + row * (sh2 + 0.35)
    box(s, x, y, sw2, sh2, alpha=94)
    text(s, x + 0.35, y + 0.25, sw2 - 0.7, 1.2, num, size=60, bold=True, color=TEAL_MID, font='Times New Roman')
    text(s, x + 0.35, y + 1.55, sw2 - 0.7, 1.1, lbl, size=14, color=INK)
run_y = 2.85 + 2 * (sh2 + 0.35)
box(s, L, run_y, 2 * sw2 + 0.35, 10.6 - run_y, fill=TEAL, line=None)
text(s, L + 0.35, run_y + 0.2, 8.0, 0.4, 'RUN IT LOCALLY', size=13, bold=True, color=CYAN)
text(s, L + 0.35, run_y + 0.6, 8.2, 0.5, 'npm install  →  npm run dev  →  localhost:5173', size=17, bold=True, color=WHITE, font='Courier New')

rx = 10.35
box(s, rx, 2.85, R - rx, 7.75, alpha=94)
text(s, rx + 0.4, 3.1, R - rx - 0.8, 0.45, 'Verified', size=20, bold=True, color=TEAL)
bullets(s, rx + 0.4, 3.65, R - rx - 0.8, 2.3, [
    'Scrubbing moves time, phase, score (10 → 53 → 82), events and graph together',
    'Incident ↔ detection links open the matching record',
    'Every score equals the sum of its factors (82 and 61)',
    'Zero console errors across all routes',
], size=15, gap=6)
text(s, rx + 0.4, 5.95, R - rx - 0.8, 0.45, 'Next steps', size=20, bold=True, color=TEAL)
bullets(s, rx + 0.4, 6.5, R - rx - 0.8, 2.0, [
    'Build the FastAPI backend against the existing /api/* contract',
    'Ingest real Zeek and NetFlow telemetry',
    'Replace scripted scores with a trained baseline model',
    'Check the printed PDF of the investigation report',
], size=15, gap=6)
box(s, rx + 0.4, 8.85, R - rx - 0.8, 1.45, fill=CYAN_TINT, line=None)
text(s, rx + 0.65, 9.0, R - rx - 1.3, 1.2,
     [[('Honest limits: ', {'bold': True, 'color': RED}),
       ('all telemetry is simulated and the frontend performs no live detection. Addresses use RFC 5737 ranges and .example domains.', {})]],
     size=13, color=INK, line_spacing=1.05)

prs.save('Network Flight Recorder - HackSprint.pptx')
print('saved')
