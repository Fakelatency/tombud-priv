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
  phone: '+48 XXX XXX XXX', // Placeholder - update with actual if known
  email: 'i@example.com', // Placeholder - update with actual if known
  nip: 'NIP: 5542773965',
  regon: 'REGON: 340396405',
};

interface CalculationResult { length: number; weight: number; netCost: number; marginAmount: number; netWithMargin: number; grossCost: number; }
type ShapeType = 'rectangle' | 'L' | 'U';
interface OfferPDFProps {
  clientName: string; clientEmail: string; shapeType: ShapeType; diameter: number;
  overlapLength?: number; width?: number; height?: number; arm1Length?: number; arm2Length?: number; arm3Length?: number;
  result: CalculationResult; margin: number;
}

const styles = StyleSheet.create({ /* ... Your existing styles ... */
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 30, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#cccccc' },
  companyDetails: { fontSize: 9, textAlign: 'left', lineHeight: 1.4, fontFamily: 'Helvetica', maxWidth: '55%' },
  clientDetails: { fontSize: 9, textAlign: 'right', lineHeight: 1.4, fontFamily: 'Helvetica', maxWidth: '45%' },
  title: { fontSize: 16, textAlign: 'center', marginBottom: 20, fontFamily: 'Helvetica', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, marginBottom: 8, color: '#333333', fontFamily: 'Helvetica', fontWeight: 'bold' },
  text: { fontSize: 10, marginBottom: 4, lineHeight: 1.4, fontFamily: 'Helvetica' },
  boldText: { fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'bold' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f2f2f2', padding: 5, fontFamily: 'Helvetica', fontWeight: 'bold' },
  tableColHeaderAmount: { width: '30%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f2f2f2', padding: 5, textAlign: 'right', fontFamily: 'Helvetica', fontWeight: 'bold' },
  tableCol: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, padding: 5, fontFamily: 'Helvetica' },
  tableColAmount: { width: '30%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0, padding: 5, textAlign: 'right', fontFamily: 'Helvetica' },
  svgContainer: { alignItems: 'center', marginTop: 10, marginBottom: 20, padding: 10, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 3 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#666666', borderTopWidth: 1, borderTopColor: '#cccccc', paddingTop: 10, fontFamily: 'Helvetica', lineHeight: 1.3 },
  dimensionText: { fontSize: 8, fill: '#555555', fontFamily: 'Helvetica' }
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
      <Svg x={labelX - 15} y={labelY - 5} width="30" height="12"> {/* Ensure this Svg text wrapper is large enough */}
        <Text style={styles.dimensionText} dominantBaseline="middle" textAnchor={textAnchor}>{label} cm</Text>
      </Svg>
    </G>
  );
};

const offsetValue = 5; // Small gap for dimension lines from the shape

const renderPdfShape = (props: OfferPDFProps) => {
  const { shapeType, width = 0, height = 0, arm1Length = 0, arm2Length = 0, arm3Length = 0, overlapLength = 0 } = props;

  const svgPadding = 30; // Can be adjusted
  const svgViewportWidth = 280; // NEW: Wider viewport
  const svgViewportHeight = 240; // NEW: Adjusted height for viewport (can be same as width or different)

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

  if (maxDimension === 0 || (maxDimension === 1 && relevantDimensions.length === 0 && width === 0 && height === 0 && arm1Length === 0)) { // Added more checks for truly empty shapes
    return (
      <Svg width={svgViewportWidth} height={svgViewportHeight} style={{ backgroundColor: '#f9f9f9', borderRadius: 3 }}>
          <Text style={{...styles.text, fontSize:9, fill: '#888888', x: svgViewportWidth/2, y: svgViewportHeight/2, textAnchor: 'middle', dominantBaseline:'middle' }}>No dimensions</Text>
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
    shapeLogicalWidth = props.width;
    shapeLogicalHeight = arm1Length; // Primary height for U drawing path
  }
  
  // Fallback for logical dimensions if they are zero but maxDimension indicates a shape
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
            // Important: Use the original width/height props for calculating scaled dimensions of the shape itself
            const rectWidth = width * scale;
            const rectHeight = height * scale;

            const scaledOverlap = overlapLength * scale;
            const overlapAngle = Math.PI / 4;
            const S = scaledOverlap; const cosA = Math.cos(overlapAngle); const sinA = Math.sin(overlapAngle);
            const dimLineStartX = rectX + rectWidth; const dimLineStartY = rectY;
            const dimLineEndX = dimLineStartX - S * cosA; const dimLineEndY = dimLineStartY + S * sinA;
            const halfTotalOffset = overlapLineOffset / 2; const perpOffsetX = halfTotalOffset * sinA; const perpOffsetY = halfTotalOffset * cosA;
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
            return (
              <G>
                <Path d={`M ${startX} ${startY} L ${startX + props.arm1Length * scale} ${startY} L ${startX + props.arm1Length * scale} ${startY + props.arm2Length * scale}`} fill="none" stroke="#2563eb" strokeWidth="1"/>
                {renderPdfDimensionLine(startX, startY - offsetValue, startX + props.arm1Length * scale, startY - offsetValue, props.arm1Length.toString(), 8, 'above')}
                {renderPdfDimensionLine(startX + props.arm1Length * scale + offsetValue, startY, startX + props.arm1Length * scale + offsetValue, startY + props.arm2Length * scale, props.arm2Length.toString(), 10, 'right')}
              </G>
            );
          case 'U':
            if (!props.arm1Length || !props.width || !props.arm3Length) return null;
            return (
              <G>
                <Path d={`M ${startX} ${startY} L ${startX} ${startY + props.arm1Length * scale} L ${startX + props.width * scale} ${startY + props.arm1Length * scale} L ${startX + props.width * scale} ${startY + props.arm1Length * scale - props.arm3Length * scale}`} fill="none" stroke="#2563eb" strokeWidth="1"/>
                {renderPdfDimensionLine(startX - offsetValue, startY, startX - offsetValue, startY + props.arm1Length * scale, props.arm1Length.toString(), 7, 'left')}
                {renderPdfDimensionLine(startX, startY + props.arm1Length * scale + offsetValue, startX + props.width * scale, startY + props.arm1Length * scale + offsetValue, props.width.toString(), 8, 'below')}
                {renderPdfDimensionLine(startX + props.width * scale + offsetValue, startY + props.arm1Length * scale - props.arm3Length * scale, startX + props.width * scale + offsetValue, startY + props.arm1Length * scale, props.arm3Length.toString(), 10, 'right')}
              </G>
            );
          default: return null;
        }
      })()}
    </Svg>
  );
};

const OfferPDFDocument: React.FC<OfferPDFProps> = (props) => {
  const { clientName, clientEmail, shapeType, diameter, overlapLength, result, margin } = props;
  const date = new Date().toLocaleDateString('en-GB');
  const vatAmount = result.grossCost - result.netWithMargin;

  let shapeDescription = '';
  switch (shapeType) {
    case 'rectangle': shapeDescription = `Rectangle (Width: ${props.width}cm, Height: ${props.height}cm, Overlap: ${overlapLength}cm)`; break;
    case 'L': shapeDescription = `L-Shape (Horiz. Arm: ${props.arm1Length}cm, Vert. Arm: ${props.arm2Length}cm)`; break;
    case 'U': shapeDescription = `U-Shape (Left Arm: ${props.arm1Length}cm, Width: ${props.width}cm, Right Arm: ${props.arm3Length}cm)`; break;
  }

  return (
    <Document author={YOUR_COMPANY_DATA.name} title={`Offer for ${clientName || 'Client'} - ${date}`}>
      <Page size="A4" style={styles.page}>
        {/* Header View (fixed) */}
        <View style={styles.header} fixed>
          <View style={styles.companyDetails}>
            <Text style={{...styles.boldText, fontSize: 11}}>{YOUR_COMPANY_DATA.name}</Text>
            <Text>{YOUR_COMPANY_DATA.addressLine1}</Text>
            <Text>{YOUR_COMPANY_DATA.addressLine2}, {YOUR_COMPANY_DATA.addressRegion}</Text>
            {YOUR_COMPANY_DATA.phone !== '+48 XXX XXX XXX' && <Text>Tel: {YOUR_COMPANY_DATA.phone}</Text>}
            {YOUR_COMPANY_DATA.email !== 'i@example.com' && <Text>Email: {YOUR_COMPANY_DATA.email}</Text>} {/* Updated placeholder check */}
            <Text>{YOUR_COMPANY_DATA.nip}</Text>
            <Text>{YOUR_COMPANY_DATA.regon}</Text>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.boldText}>Client Details:</Text>
            <Text>{clientName || 'N/A'}</Text>
            {clientEmail ? <Text>{clientEmail}</Text> : null }
            <Text style={{marginTop: 5, ...styles.boldText}}>Offer Date:</Text>
            <Text>{date}</Text>
          </View>
        </View>

        <Text style={styles.title}>PRICE OFFER</Text>

        {/* Intro Section */}
        <View style={styles.section}>
          <Text style={styles.text}>Dear {clientName || 'Client'},</Text>
          <Text style={styles.text}>
            Thank you for your interest in our offer. Below, please find the detailed quotation:
          </Text>
        </View>

        {/* Specification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SPECIFICATION:</Text>
          <Text style={styles.text}>- Shape Type: {shapeDescription}</Text>
          <Text style={styles.text}>- Rebar Diameter: Φ{diameter}mm</Text>
          <Text style={styles.text}>- Total Length: {result.length.toFixed(2)}m</Text>
          <Text style={styles.text}>- Weight: {result.weight.toFixed(2)}kg</Text>
        </View>

        {/* SVG Container */}
        <View style={styles.svgContainer}>
             <Text style={{...styles.sectionTitle, marginBottom: 5, textAlign: 'center'}}>Shape Preview:</Text>
            {renderPdfShape(props)}
        </View>

        {/* Costs Section - Simplified as per your version */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COST CALCULATION:</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}><Text style={styles.tableColHeader}>Description</Text><Text style={styles.tableColHeaderAmount}>Amount (PLN)</Text></View>
            {/* Simplified table rows */}
            <View style={styles.tableRow}><Text style={{...styles.tableCol, fontWeight: 'bold'}}>Net Price</Text><Text style={{...styles.tableColAmount, fontWeight: 'bold'}}>{result.netWithMargin.toFixed(2)}</Text></View>
            <View style={styles.tableRow}><Text style={styles.tableCol}>VAT (23%)</Text><Text style={styles.tableColAmount}>{vatAmount.toFixed(2)}</Text></View>
            <View style={styles.tableRow}><Text style={{...styles.tableCol, fontWeight: 'bold', backgroundColor: '#e8e8e8'}}>Final Price</Text><Text style={{...styles.tableColAmount, fontWeight: 'bold', backgroundColor: '#e8e8e8'}}>{result.grossCost.toFixed(2)}</Text></View>
          </View>
        </View>

        {/* Footer Text Section */}
        <View style={styles.section}>
          <Text style={styles.text}>Offer valid for 14 days from the date of issue.</Text>
          <Text style={styles.text}>Should you have any questions, please do not hesitate to contact us.</Text>
        </View>

        {/* Page Footer (fixed) */}
        <Text style={styles.footer} fixed>
          {YOUR_COMPANY_DATA.name} | {YOUR_COMPANY_DATA.addressLine1}, {YOUR_COMPANY_DATA.addressLine2}
          {"\n"}
          {YOUR_COMPANY_DATA.nip} | {YOUR_COMPANY_DATA.regon}
        </Text>
      </Page>
    </Document>
  );
};

export default OfferPDFDocument;