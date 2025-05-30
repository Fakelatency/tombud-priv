// src/OfferPDFDocument.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Font, Rect, Line, G } from '@react-pdf/renderer';

Font.register({
  family: 'Lato', // You'll use this name in your styles
  fonts: [
    { src: '/fonts/Lato-Regular.ttf', fontWeight: 'normal' }, // Path relative to the 'public' folder
    { src: '/fonts/Lato-Bold.ttf', fontWeight: 'bold' },
    // You can add Italic, BoldItalic etc. here if you copied those files too
    // { src: '/fonts/Lato-Italic.ttf', fontStyle: 'italic' },
    // { src: '/fonts/Lato-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
  ]
});

// YOUR COMPANY DATA - As provided by you
const YOUR_COMPANY_DATA = {
  name: ' CENTRUM BUDOWLANE TOMBUD PLUS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
  addressLine1: 'Szosa Gdańska 81',
  addressLine2: '86-031 Osielsko',
  addressRegion: 'woj. kujawsko-pomorskie',
  phone: '+48 606 711 232', // Placeholder - update with actual if known
  email: 'leszekgolebiewski@tombudplus.pl', // Placeholder - update with actual if known
  nip: 'NIP: 5542773965',
  regon: 'REGON: 340396405',
};

// Updated CalculationResult interface to match App.tsx
interface CalculationResult {
  length: number; // Length of a single item
  weight: number; // Weight of a single item
  totalWeight: number; // Total weight for all items
  netCost: number; // Net cost for a single item (before margin)
  totalNetCost: number; // Total net cost for all items (before margin)
  marginAmount: number; // Margin amount for a single item
  totalMarginAmount: number; // Total margin amount for all items
  netWithMargin: number; // Net cost with margin for a single item
  totalNetWithMargin: number; // Total net cost with margin for all items
  grossCost: number; // Gross cost for a single item
  totalGrossCost: number; // Total gross cost for all items
}

type ShapeType = 'rectangle' | 'L' | 'U';
interface OfferPDFProps {
  clientName: string;
  clientEmail: string;
  shapeType: ShapeType;
  diameter: number;
  overlapLength?: number;
  width?: number;
  height?: number;
  arm1Length?: number;
  arm2Length?: number;
  arm3Length?: number;
  result: CalculationResult; // Uses the updated CalculationResult
  margin: number; // Kept for context if needed, though totals are in result
  numberOfItems: number; // Added numberOfItems
}

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 20, fontFamily: 'Lato' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#cccccc' },
  companyDetails: { fontSize: 9, textAlign: 'left', lineHeight: 1.4, fontFamily: 'Lato', maxWidth: '55%' },
  clientDetails: { fontSize: 9, textAlign: 'right', lineHeight: 1.4, fontFamily: 'Lato', maxWidth: '45%' },
  title: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontFamily: 'Lato', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, marginBottom: 8, color: '#333333', fontFamily: 'Lato', fontWeight: 'bold' },
  text: { fontSize: 10, marginBottom: 4, lineHeight: 1.4, fontFamily: 'Lato' },
  boldText: { fontSize: 10, fontFamily: 'Lato', fontWeight: 'bold' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f2f2f2', padding: 5, fontFamily: 'Lato', fontWeight: 'bold' },
  tableColHeaderAmount: { width: '30%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f2f2f2', padding: 5, textAlign: 'right', fontFamily: 'Lato', fontWeight: 'bold' },
  tableCol: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, padding: 5, fontFamily: 'Lato' },
  tableColAmount: { width: '30%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, padding: 5, textAlign: 'right', fontFamily: 'Lato' },
  svgContainer: { alignItems: 'center', marginTop: 10, marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 3 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#666666', borderTopWidth: 1, borderTopColor: '#cccccc', paddingTop: 10, fontFamily: 'Lato', lineHeight: 1.3 },
  dimensionText: { fontSize: 8, fill: '#555555', fontFamily: 'Lato' }
});

const renderPdfDimensionLine = (
  x1: number, y1: number, x2: number, y2: number, label: string,
  offset: number = 10, position: 'above' | 'below' | 'right' | 'left' = 'above'
) => {
  const dx = x2 - x1; const dy = y2 - y1; const angle = Math.atan2(dy, dx);
  const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2;
  let labelX = midX; let labelY = midY; let textAnchor: 'middle' | 'start' | 'end' = 'middle';

  switch (position) {
    case 'above': labelX = midX - offset * Math.sin(angle); labelY =  labelY = midY - offset * Math.cos(angle) - 1; break;
    case 'below': labelX = midX + offset * Math.sin(angle); labelY = midY - offset * Math.cos(angle) + 6; break;
    case 'right': labelX = midX + offset * Math.cos(angle) + 2; labelY = midY + offset * Math.sin(angle); textAnchor = 'start'; break;
    case 'left': labelX = midX - offset * Math.cos(angle) - 2; labelY = midY - offset * Math.sin(angle); textAnchor = 'end'; break;
  }
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2 2" />
      <Line x1={x1 - 2 * Math.sin(angle)} y1={y1 + 2 * Math.cos(angle)} x2={x1 + 2 * Math.sin(angle)} y2={y1 - 2 * Math.cos(angle)} stroke="#6b7280" strokeWidth="0.5" />
      <Line x1={x2 - 2 * Math.sin(angle)} y1={y2 + 2 * Math.cos(angle)} x2={x2 + 2 * Math.sin(angle)} y2={y2 - 2 * Math.cos(angle)} stroke="#6b7280" strokeWidth="0.5" />
      <Svg x={labelX - 15} y={labelY - 5} width="30" height="12">
        <Text style={styles.dimensionText} dominantBaseline="middle" textAnchor={textAnchor}>{label} cm</Text>
      </Svg>
    </G>
  );
};

const offsetValue = 5;

const renderPdfShape = (props: OfferPDFProps) => {
  const { shapeType, width = 0, height = 0, arm1Length = 0, arm2Length = 0, arm3Length = 0, overlapLength = 0 } = props;

  const svgPadding = 30; 
  const svgViewportWidth = 280; 
  const svgViewportHeight = 180; 

  const relevantDimensions = [
    shapeType === 'rectangle' ? width : 0,
    shapeType === 'rectangle' ? height : 0,
    (shapeType === 'L' || shapeType === 'U') ? arm1Length : 0,
    shapeType === 'L' ? arm2Length : 0,
    (shapeType === 'U' && shapeType !== 'rectangle') ? width : 0, 
    shapeType === 'U' ? arm3Length : 0,
    shapeType === 'rectangle' ? overlapLength : 0
  ].filter(dim => dim > 0);

  const maxDimension = relevantDimensions.length > 0 ? Math.max(...relevantDimensions) : 1;

  if (maxDimension === 0 || (maxDimension === 1 && relevantDimensions.length === 0 && width === 0 && height === 0 && arm1Length === 0)) {
    return (
      <Svg width={svgViewportWidth} height={svgViewportHeight} style={{ backgroundColor: '#f9f9f9', borderRadius: 3 }}>
          <Text style={{...styles.text, fontSize:9, fill: '#888888', x: svgViewportWidth/2, y: svgViewportHeight/2, textAnchor: 'middle', dominantBaseline:'middle' }}>Brak wymiarów</Text>
      </Svg>
    );
  }

  const drawingAreaWidth = svgViewportWidth - svgPadding * 2;
  const drawingAreaHeight = svgViewportHeight - svgPadding * 2;

  const scale = Math.min(drawingAreaWidth, drawingAreaHeight) / maxDimension;

  let shapeLogicalWidth = 0;
  let shapeLogicalHeight = 0;

  if (shapeType === 'rectangle') {
    shapeLogicalWidth = width;
    shapeLogicalHeight = height;
  } else if (shapeType === 'L') {
    shapeLogicalWidth = arm1Length; 
    shapeLogicalHeight = arm2Length; 
  } else if (shapeType === 'U') {
    shapeLogicalWidth = props.width || 0; 
    shapeLogicalHeight = arm1Length; 
  }
  
  if (shapeLogicalWidth === 0 && maxDimension > 0) shapeLogicalWidth = maxDimension;
  if (shapeLogicalHeight === 0 && maxDimension > 0) shapeLogicalHeight = maxDimension;


  const drawnShapeWidth = shapeLogicalWidth * scale;
  const drawnShapeHeight = shapeLogicalHeight * scale;
  
  const startX = svgPadding + (drawingAreaWidth - drawnShapeWidth) / 2;
  const startY = svgPadding + (drawingAreaHeight - drawnShapeHeight) / 2;
  
  const overlapLineOffset = 3 * scale;

  return (
    <Svg width={svgViewportWidth} height={svgViewportHeight} style={{ backgroundColor: '#f9f9f9', borderRadius: 3 }}>
      {(() => {
        switch (shapeType) {
          case 'rectangle':
            const rectX = startX;
            const rectY = startY;
            const rectWidth = width * scale;
            const rectHeight = height * scale;

            const scaledOverlap = overlapLength * scale;
            const overlapAngle = Math.PI / 4; 
            const S = scaledOverlap; const cosA = Math.cos(overlapAngle); const sinA = Math.sin(overlapAngle);
            const dimLineStartX = rectX + rectWidth; const dimLineStartY = rectY;
            const dimLineEndX = dimLineStartX - S * cosA; const dimLineEndY = dimLineStartY + S * sinA;
            const halfTotalOffset = overlapLineOffset / 3; const perpOffsetX = halfTotalOffset * sinA; const perpOffsetY = halfTotalOffset * cosA;
            const line1StartX = dimLineStartX + perpOffsetX; const line1StartY = dimLineStartY + perpOffsetY;
            const line1EndX = dimLineEndX + perpOffsetX; const line1EndY = dimLineEndY + perpOffsetY;
            const line2StartX = dimLineStartX - perpOffsetX; const line2StartY = dimLineStartY - perpOffsetY;
            const line2EndX = dimLineEndX - perpOffsetX; const line2EndY = dimLineEndY - perpOffsetY;
            return (
              <G>
                <Rect x={rectX} y={rectY} width={rectWidth} height={rectHeight} fill="none" stroke="#2563eb" strokeWidth="1" />
                <Path d={`M ${line1StartX} ${line1StartY} L ${line1EndX} ${line1EndY}`} stroke="#dc2626" strokeWidth="1" />
                <Path d={`M ${line2StartX} ${line2StartY} L ${line2EndX} ${line2EndY}`} stroke="#dc2626" strokeWidth="1" />
                {renderPdfDimensionLine(rectX, rectY - offsetValue, rectX + rectWidth, rectY - offsetValue, width.toString(), 8, 'above')}
                {renderPdfDimensionLine(rectX - offsetValue, rectY, rectX - offsetValue, rectY + rectHeight, height.toString(), 12, 'left')}
                {renderPdfDimensionLine(dimLineStartX, dimLineStartY, dimLineEndX, dimLineEndY, overlapLength.toString(), 18, 'below')}
              </G>
            );
          case 'L':
            if (!props.arm1Length || !props.arm2Length) return null;
            const arm1L = props.arm1Length * scale;
            const arm2L = props.arm2Length * scale;
            return (
              <G>
                <Path d={`M ${startX} ${startY} L ${startX + arm1L} ${startY} L ${startX + arm1L} ${startY + arm2L}`} fill="none" stroke="#2563eb" strokeWidth="1"/>
                {renderPdfDimensionLine(startX, startY - offsetValue, startX + arm1L, startY - offsetValue, props.arm1Length.toString(), 8, 'above')}
                {renderPdfDimensionLine(startX + arm1L + offsetValue, startY, startX + arm1L + offsetValue, startY + arm2L, props.arm2Length.toString(), 10, 'right')}
              </G>
            );
          case 'U':
            if (!props.arm1Length || !props.width || !props.arm3Length) return null;
            const arm1U = props.arm1Length * scale;
            const baseU = props.width * scale;
            const arm3U = props.arm3Length * scale;
            return (
              <G>
                <Path d={`M ${startX} ${startY} L ${startX} ${startY + arm1U} L ${startX + baseU} ${startY + arm1U} L ${startX + baseU} ${startY + arm1U - arm3U}`} fill="none" stroke="#2563eb" strokeWidth="1"/>
                {renderPdfDimensionLine(startX - offsetValue, startY, startX - offsetValue, startY + arm1U, props.arm1Length.toString(), 7, 'left')}
                {renderPdfDimensionLine(startX, startY + arm1U + offsetValue, startX + baseU, startY + arm1U + offsetValue, props.width.toString(), 8, 'below')}
                {renderPdfDimensionLine(startX + baseU + offsetValue, startY + arm1U - arm3U, startX + baseU + offsetValue, startY + arm1U, props.arm3Length.toString(), 10, 'right')}
              </G>
            );
          default: return null;
        }
      })()}
    </Svg>
  );
};

const OfferPDFDocument: React.FC<OfferPDFProps> = (props) => {
  const { clientName, clientEmail, shapeType, diameter, overlapLength, result, numberOfItems } = props;
  const date = new Date().toLocaleDateString('pl-PL');
  const totalVatAmount = result.totalGrossCost - result.totalNetWithMargin;

  let shapeDescription = '';
  switch (shapeType) {
    case 'rectangle': shapeDescription = `Prostokąt (Szerokość: ${props.width}cm, Wysokość: ${props.height}cm, Zakład: ${overlapLength}cm)`; break;
    case 'L': shapeDescription = `Kształt L (Ramię poz.: ${props.arm1Length}cm, Ramię pion.: ${props.arm2Length}cm)`; break;
    case 'U': shapeDescription = `Kształt U (Lewe ramię: ${props.arm1Length}cm, Szerokość: ${props.width}cm, Prawe ramię: ${props.arm3Length}cm)`; break;
  }

  return (
    <Document author={YOUR_COMPANY_DATA.name} title={`Oferta dla ${clientName || 'Klienta'} - ${date}`}>
      <Page size="A4" style={styles.page}>
        {/* Header View (fixed) */}
        <View style={styles.header} fixed>
          <View style={styles.companyDetails}>
            <Text style={{...styles.boldText, fontSize: 11}}>{YOUR_COMPANY_DATA.name}</Text>
            <Text>{YOUR_COMPANY_DATA.addressLine1}</Text>
            <Text>{YOUR_COMPANY_DATA.addressLine2}, {YOUR_COMPANY_DATA.addressRegion}</Text>
            {YOUR_COMPANY_DATA.phone !== '+48 XXX XXX XXX' && <Text>Tel: {YOUR_COMPANY_DATA.phone}</Text>}
            {YOUR_COMPANY_DATA.email !== 'i@example.com' && <Text>Email: {YOUR_COMPANY_DATA.email}</Text>}
            <Text>{YOUR_COMPANY_DATA.nip}</Text>
            <Text>{YOUR_COMPANY_DATA.regon}</Text>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.boldText}>Dane Klienta:</Text>
            <Text>{clientName || 'Brak danych'}</Text>
            {clientEmail ? <Text>{clientEmail}</Text> : null }
            <Text style={{marginTop: 5, ...styles.boldText}}>Data Oferty:</Text>
            <Text>{date}</Text>
          </View>
        </View>

        <Text style={styles.title}>OFERTA CENOWA</Text>

        {/* Intro Section */}
        <View style={styles.section}>
          <Text style={styles.text}>
            Dziękujemy za zainteresowanie naszą ofertą. Poniżej przedstawiamy szczegółową wycenę dla {numberOfItems} szt.:
          </Text>
        </View>

        {/* Specification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPECYFIKACJA ZAMÓWIENIA (dla {numberOfItems} szt.):</Text>
          <Text style={styles.text}>- Rodzaj kształtu: {shapeDescription}</Text>
          <Text style={styles.text}>- Średnica pręta: Φ{diameter}mm</Text>
          <Text style={styles.text}>- Liczba sztuk: {numberOfItems}</Text>
          <Text style={styles.text}>- Waga 1 szt.: {result.weight.toFixed(2)}kg</Text>
          <Text style={{...styles.text, ...styles.boldText}}>- Waga całkowita ({numberOfItems} szt.): {result.totalWeight.toFixed(2)}kg</Text>
          <Text style={{...styles.text, ...styles.boldText}}>Cena za 1 szt. brutto: {(result.totalGrossCost / numberOfItems).toFixed(2)} PLN</Text>
        </View>

        {/* SVG Container - Shows shape for 1 item */}
        <View style={styles.svgContainer}>
             <Text style={{...styles.sectionTitle, marginBottom: 5, textAlign: 'center'}}>Podgląd kształtu (1 szt.):</Text>
            {renderPdfShape(props)}
        </View>

        {/* Costs Section - Updated for total values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KALKULACJA KOSZTÓW (dla {numberOfItems} szt.):</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}><Text style={styles.tableColHeader}>Opis</Text><Text style={styles.tableColHeaderAmount}>Kwota (PLN)</Text></View>
            <View style={styles.tableRow}><Text style={{...styles.tableCol, fontWeight: 'bold'}}>Cena netto</Text><Text style={{...styles.tableColAmount, fontWeight: 'bold'}}>{result.totalNetWithMargin.toFixed(2)}</Text></View>
            <View style={styles.tableRow}><Text style={styles.tableCol}>VAT (23%)</Text><Text style={styles.tableColAmount}>{totalVatAmount.toFixed(2)}</Text></View>
            <View style={styles.tableRow}><Text style={{...styles.tableCol, fontWeight: 'bold', backgroundColor: '#e8e8e8'}}>Cena brutto</Text><Text style={{...styles.tableColAmount, fontWeight: 'bold', backgroundColor: '#e8e8e8'}}>{result.totalGrossCost.toFixed(2)}</Text></View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default OfferPDFDocument;
