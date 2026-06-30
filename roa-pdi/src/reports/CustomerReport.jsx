import {
  Document, Page, View, Text, StyleSheet,
} from '@react-pdf/renderer';
import ReportLogo from './ReportLogo';
import { buildReportModel } from './reportModel';
import { BRAND } from './fonts';

// Customer-facing PDI summary. Follows ROA brand standards: grayscale only
// (no accent colors), Rajdhani for headlines, DM Sans for body, official
// wordmark, and ROA vocabulary (Roamer, Experience Center). Voice is confident,
// genuine, expert, simple — benefits over specs.
const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 60, paddingHorizontal: 48, fontFamily: 'DM Sans', fontSize: 10, color: BRAND.deepGraphite },

  rule: { borderBottomWidth: 1, borderBottomColor: BRAND.black, marginTop: 16, marginBottom: 22 },

  kicker: { fontFamily: 'Rajdhani', fontWeight: 400, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: BRAND.midGraphite, marginBottom: 4 },
  title:  { fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 30, letterSpacing: 1, textTransform: 'uppercase', color: BRAND.black, lineHeight: 1.05 },

  intro:  { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 11, lineHeight: 1.55, color: BRAND.darkGraphite, marginTop: 16, marginBottom: 24, maxWidth: 440 },

  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: BRAND.hairline, borderBottomWidth: 1, borderBottomColor: BRAND.hairline, paddingVertical: 12, marginBottom: 26 },
  metaCell: { width: '25%' },
  metaLabel:{ fontFamily: 'Rajdhani', fontWeight: 400, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: BRAND.midGraphite, marginBottom: 3 },
  metaVal:  { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 11, color: BRAND.black },

  summaryRow: { flexDirection: 'row', marginBottom: 30 },
  bigStat:    { marginRight: 48 },
  bigNum:     { fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 46, color: BRAND.black, lineHeight: 1 },
  bigLabel:   { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 9, color: BRAND.midGraphite, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },

  sectionHead: { fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: BRAND.black, marginBottom: 10 },

  catRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BRAND.hairline },
  dotFull:  { width: 9, height: 9, borderRadius: 5, backgroundColor: BRAND.deepGraphite, marginRight: 10 },
  dotRing:  { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: BRAND.darkGraphite, marginRight: 10 },
  catName:  { flex: 1, fontFamily: 'DM Sans', fontWeight: 700, fontSize: 10, color: BRAND.deepGraphite },
  catCount: { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 9, color: BRAND.midGraphite },

  flagWrap:  { marginTop: 26 },
  flagNote:  { fontFamily: 'DM Sans', fontWeight: 400, fontStyle: 'italic', fontSize: 9.5, color: BRAND.darkGraphite, marginBottom: 10, lineHeight: 1.5 },
  flagItem:  { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BRAND.hairline },
  flagCat:   { width: 120, fontFamily: 'Rajdhani', fontWeight: 400, fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: BRAND.midGraphite },
  flagText:  { flex: 1, fontFamily: 'DM Sans', fontWeight: 400, fontSize: 9.5, color: BRAND.deepGraphite },

  closing:  { fontFamily: 'DM Sans', fontWeight: 400, fontSize: 11, lineHeight: 1.55, color: BRAND.darkGraphite, marginTop: 30 },
  signoff:  { fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: BRAND.black, marginTop: 8 },

  footer: { position: 'absolute', bottom: 26, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BRAND.hairline, paddingTop: 8 },
  footText: { fontFamily: 'DM Sans', fontWeight: 300, fontSize: 8, color: BRAND.midGraphite },
});

// Per-category cleared counts so the summary can be honest about anything we flagged.
function categoryStats(cat) {
  let cleared = 0;
  for (const it of cat.items) {
    if (it.result === 'pass' || it.result === 'not_applicable') cleared += 1;
  }
  return { total: cat.items.length, cleared };
}

export default function CustomerReport({ pdi, items }) {
  const m = buildReportModel(pdi, items);
  const cleared = m.stats.passed + (m.stats.evaluated - m.stats.passed - m.stats.failed);

  return (
    <Document
      title={`Pre-Delivery Inspection — ${m.roNumber}`}
      author="ROA Off-Road"
      subject="Your ROA Off-Road pre-delivery inspection"
    >
      <Page size="LETTER" style={s.page}>
        <ReportLogo width={150} />
        <View style={s.rule} />

        <Text style={s.kicker}>Pre-Delivery Inspection</Text>
        <Text style={s.title}>Ready For The Road Ahead</Text>

        <Text style={s.intro}>
          Before your trailer leaves our Experience Center, our team puts it
          through a complete pre-delivery inspection. Every system below was
          checked by hand, so the only thing on your mind when you reach the
          trailhead is where to point it next.
        </Text>

        <View style={s.metaRow}>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Reference</Text>
            <Text style={s.metaVal}>{m.roNumber}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Trailer</Text>
            <Text style={s.metaVal}>{m.manufacturerLabel}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Inspected By</Text>
            <Text style={s.metaVal}>{m.technicianName}</Text>
          </View>
          <View style={s.metaCell}>
            <Text style={s.metaLabel}>Completed</Text>
            <Text style={s.metaVal}>{m.completedAt}</Text>
          </View>
        </View>

        <View style={s.summaryRow}>
          <View style={s.bigStat}>
            <Text style={s.bigNum}>{m.stats.evaluated}</Text>
            <Text style={s.bigLabel}>Systems Inspected</Text>
          </View>
          <View style={s.bigStat}>
            <Text style={s.bigNum}>{cleared}</Text>
            <Text style={s.bigLabel}>Cleared</Text>
          </View>
          {m.failed.length > 0 && (
            <View style={s.bigStat}>
              <Text style={s.bigNum}>{m.failed.length}</Text>
              <Text style={s.bigLabel}>Flagged</Text>
            </View>
          )}
        </View>

        <Text style={s.sectionHead}>What We Inspected</Text>
        {m.categories.map((cat) => {
          const cs = categoryStats(cat);
          const allClear = cs.cleared === cs.total;
          return (
            <View key={cat.name} style={s.catRow} wrap={false}>
              <View style={allClear ? s.dotFull : s.dotRing} />
              <Text style={s.catName}>{cat.name}</Text>
              <Text style={s.catCount}>
                {allClear ? `${cs.total} checked` : `${cs.cleared} of ${cs.total} cleared`}
              </Text>
            </View>
          );
        })}

        {/* Honest about anything flagged — we don't soften the truth. */}
        {m.failed.length > 0 && (
          <View style={s.flagWrap} wrap={false}>
            <Text style={s.sectionHead}>Flagged For Attention</Text>
            <Text style={s.flagNote}>
              These items were noted during inspection. Your Sales Coach will walk
              you through each one so nothing follows you onto the trail.
            </Text>
            {m.failed.map((it) => (
              <View key={it.id} style={s.flagItem} wrap={false}>
                <Text style={s.flagCat}>{it.category}</Text>
                <Text style={s.flagText}>{it.itemText}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.closing}>
          Thank you for choosing ROA Off-Road. You are not just picking up a
          trailer, you are joining a community of Roamers who believe the right
          rig changes where you go and who you are when you get there.
        </Text>
        <Text style={s.signoff}>Welcome to the road ahead.</Text>

        <View style={s.footer} fixed>
          <Text style={s.footText}>ROA Off-Road · rvsofamerica.com</Text>
          <Text style={s.footText}>Reference {m.roNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
