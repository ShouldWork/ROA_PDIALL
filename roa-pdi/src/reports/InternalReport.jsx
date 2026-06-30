import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';
import { buildReportModel } from './reportModel';

// Internal document — NOT customer-facing, so ROA visual brand does not apply.
// It uses Helvetica (built in, no font load) and color for fast shop-floor
// scanning. ROA vocabulary still applies in any wording shown to people.
const C = {
  ink:    '#1A1A1A',
  muted:  '#666666',
  line:   '#DDDDDD',
  pass:   '#1B7F3B',
  fail:   '#C0392B',
  na:     '#777777',
  untest: '#B0B0B0',
  zebra:  '#F6F6F6',
  flagBg: '#FCEDEC',
};

const RESULT = {
  pass:           { label: 'PASS',     color: C.pass },
  fail:           { label: 'FAIL',     color: C.fail },
  not_applicable: { label: 'N/A',      color: C.na },
  untested:       { label: 'UNTESTED', color: C.untest },
};

const ACC_RESULT = {
  present:        { label: 'PRESENT',     color: C.pass },
  not_present:    { label: 'NOT PRESENT', color: C.fail },
  not_applicable: { label: 'N/A',         color: C.na },
};

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 54, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 9, color: C.ink },

  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title:   { fontFamily: 'Helvetica-Bold', fontSize: 16 },
  tag:     { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#FFFFFF', backgroundColor: C.ink, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 2 },
  ro:      { fontSize: 11, color: C.muted, marginBottom: 12 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, marginBottom: 14 },
  metaCell: { width: '25%', marginBottom: 8 },
  metaLabel:{ fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaVal:  { fontFamily: 'Helvetica-Bold', fontSize: 10 },

  statRow:  { flexDirection: 'row', marginBottom: 16 },
  statCell: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 3, paddingVertical: 8, paddingHorizontal: 6, marginRight: 6 },
  statNum:  { fontFamily: 'Helvetica-Bold', fontSize: 16 },
  statLbl:  { fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  section:   { fontFamily: 'Helvetica-Bold', fontSize: 11, marginTop: 6, marginBottom: 6 },
  flagBox:   { backgroundColor: C.flagBg, borderRadius: 3, padding: 10, marginBottom: 16 },
  flagItem:  { marginBottom: 8 },
  flagCat:   { fontSize: 7, color: C.fail, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  flagText:  { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  thumbRow:  { flexDirection: 'row', marginTop: 4 },
  thumb:     { width: 78, height: 78, marginRight: 5, borderRadius: 2, objectFit: 'cover', borderWidth: 1, borderColor: C.line },

  catHead:   { fontFamily: 'Helvetica-Bold', fontSize: 10, backgroundColor: '#EFEFEF', paddingVertical: 4, paddingHorizontal: 6, marginTop: 10, marginBottom: 0 },
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.line },
  rowZebra:  { backgroundColor: C.zebra },
  itemText:  { flex: 1, paddingRight: 8 },
  sub:       { fontSize: 7, color: C.muted },
  resultTag: { fontFamily: 'Helvetica-Bold', fontSize: 8, width: 58, textAlign: 'right' },

  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: C.muted, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 },
});

function Meta({ label, value }) {
  return (
    <View style={s.metaCell}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaVal}>{value}</Text>
    </View>
  );
}

function Stat({ num, label, color }) {
  return (
    <View style={s.statCell}>
      <Text style={[s.statNum, color ? { color } : {}]}>{num}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

export default function InternalReport({ pdi, items }) {
  const m = buildReportModel(pdi, items);
  const generatedAt = new Date().toLocaleString('en-US');

  return (
    <Document
      title={`PDI ${m.roNumber} — Internal Report`}
      author="ROA Off-Road"
      subject={`Internal PDI report for ${m.roNumber}`}
    >
      <Page size="LETTER" style={s.page}>
        <View style={s.headRow}>
          <Text style={s.title}>PDI Inspection Report</Text>
          <Text style={s.tag}>INTERNAL</Text>
        </View>
        <Text style={s.ro}>RO {m.roNumber} · {m.manufacturerLabel}</Text>

        <View style={s.metaGrid}>
          <Meta label="Repair Order" value={m.roNumber} />
          <Meta label="Manufacturer" value={m.manufacturerLabel} />
          <Meta label="Technician"   value={m.technicianName} />
          <Meta label="Total Time"   value={m.totalTime} />
          <Meta label="Created"      value={m.createdAt} />
          <Meta label="Completed"    value={m.completedAt} />
          <Meta label="Status"       value={m.status === 'completed' ? 'Completed' : 'Unable to Complete'} />
          <Meta label="Pass Rate"    value={`${m.stats.passRate}%`} />
        </View>

        <View style={s.statRow}>
          <Stat num={m.stats.total}     label="Checklist Items" />
          <Stat num={m.stats.evaluated} label="Evaluated" />
          <Stat num={m.stats.passed}    label="Pass" color={C.pass} />
          <Stat num={m.stats.failed}    label="Fail" color={C.fail} />
          <Stat num={m.stats.total - m.stats.evaluated} label="Open" color={C.muted} />
        </View>

        {/* Flagged items first — fastest path to what needs attention */}
        {m.failed.length > 0 && (
          <View wrap={false}>
            <Text style={[s.section, { color: C.fail }]}>Flagged Items ({m.failed.length})</Text>
            <View style={s.flagBox}>
              {m.failed.map((it) => (
                <View key={it.id} style={s.flagItem} wrap={false}>
                  <Text style={s.flagCat}>{it.category}{it.subcategory ? ` · ${it.subcategory}` : ''}</Text>
                  <Text style={s.flagText}>{it.itemText}</Text>
                  {Array.isArray(it.images) && it.images.length > 0 && (
                    <View style={s.thumbRow}>
                      {it.images.slice(0, 4).map((url, i) => (
                        <Image key={i} src={url} style={s.thumb} />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Full checklist by category */}
        <Text style={s.section}>Full Checklist</Text>
        {m.categories.map((cat) => (
          <View key={cat.name} wrap={false}>
            <Text style={s.catHead}>{cat.name}</Text>
            {cat.items.map((it, idx) => {
              const r = RESULT[it.result] ?? RESULT.untested;
              return (
                <View key={it.id} style={[s.row, idx % 2 === 1 ? s.rowZebra : {}]}>
                  <View style={s.itemText}>
                    <Text>{it.itemText}</Text>
                    {it.subcategory ? <Text style={s.sub}>{it.subcategory}</Text> : null}
                  </View>
                  <Text style={[s.resultTag, { color: r.color }]}>{r.label}</Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Accessories */}
        {m.accessories.length > 0 && (
          <View>
            <Text style={s.section}>Accessories</Text>
            {m.accessories.map((it, idx) => {
              const r = ACC_RESULT[it.result] ?? { label: 'UNCHECKED', color: C.untest };
              return (
                <View key={it.id} style={[s.row, idx % 2 === 1 ? s.rowZebra : {}]}>
                  <View style={s.itemText}>
                    <Text>{it.itemText}</Text>
                  </View>
                  <Text style={[s.resultTag, { color: r.color }]}>{r.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>ROA Off-Road · Internal PDI Report · Generated {generatedAt}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
