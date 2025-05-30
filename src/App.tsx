import React, { useState, useRef } from 'react';
import { Calculator, Square, LucideLayoutTemplate, LayoutTemplate, Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PDFDownloadLink } from '@react-pdf/renderer'; // Import PDFDownloadLink
import OfferPDFDocument from './OfferPDFDocument'; // Adjust path if needed

// register lato font
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-700.css';

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

interface RebarSpec {
  diameter: number;
  weightPerMeter: number;
  pricePerKg: number;
}

type ShapeType = 'rectangle' | 'L' | 'U';

const DEFAULT_REBAR_SPECS: RebarSpec[] = [
  { diameter: 6, weightPerMeter: 0.222, pricePerKg: 2.84 },
  { diameter: 8, weightPerMeter: 0.395, pricePerKg: 2.84 },
  { diameter: 10, weightPerMeter: 0.617, pricePerKg: 2.84 },
  { diameter: 12, weightPerMeter: 0.888, pricePerKg: 2.84 }
];

const VAT_RATE = 0.23; // 23% VAT
const MARGIN_STEPS = Array.from({ length: 21 }, (_, i) => i * 5); // 0% to 100% in steps of 5%

function App() {
  const printRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [width, setWidth] = useState<number>(20);
  const [height, setHeight] = useState<number>(20);
  const [arm1Length, setArm1Length] = useState<number>(20);
  const [arm2Length, setArm2Length] = useState<number>(20);
  const [arm3Length, setArm3Length] = useState<number>(20);
  const [margin, setMargin] = useState<number>(10);
  const [diameter, setDiameter] = useState<number>(6);
  const [rebarSpecs, setRebarSpecs] = useState<RebarSpec[]>(DEFAULT_REBAR_SPECS);
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [overlapLength, setOverlapLength] = useState<number>(5);
  const [numberOfItems, setNumberOfItems] = useState<number>(1); // <-- New state for number of items

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const calculateShape = (): CalculationResult => {
    const selectedRebar = rebarSpecs.find(spec => spec.diameter === diameter)!;
    let shapeLength = 0;

    switch (shapeType) {
      case 'rectangle':
        shapeLength = ((width * 2 + height * 2) + overlapLength) / 100;
        break;
      case 'L':
        shapeLength = (arm1Length + arm2Length) / 100;
        break;
      case 'U':
        shapeLength = (arm1Length + width + arm3Length) / 100;
        break;
    }

    const singleItemWeight = shapeLength * selectedRebar.weightPerMeter;
    const singleItemNetCost = singleItemWeight * selectedRebar.pricePerKg;
    const singleItemMarginAmount = singleItemNetCost * (margin / 100);
    const singleItemNetWithMargin = singleItemNetCost + singleItemMarginAmount;
    const singleItemGrossCost = singleItemNetWithMargin * (1 + VAT_RATE);

    const safeNumberOfItems = Math.max(1, numberOfItems); // Ensure at least 1 item

    return {
      length: shapeLength, // Length of one item
      weight: singleItemWeight, // Weight of one item
      totalWeight: singleItemWeight * safeNumberOfItems,
      netCost: singleItemNetCost,
      totalNetCost: singleItemNetCost * safeNumberOfItems,
      marginAmount: singleItemMarginAmount,
      totalMarginAmount: singleItemMarginAmount * safeNumberOfItems,
      netWithMargin: singleItemNetWithMargin,
      totalNetWithMargin: singleItemNetWithMargin * safeNumberOfItems,
      grossCost: singleItemGrossCost,
      totalGrossCost: singleItemGrossCost * safeNumberOfItems,
    };
  };

  const updateRebarWeight = (diameter: number, newWeight: number) => {
    setRebarSpecs(prevSpecs =>
      prevSpecs.map(spec =>
        spec.diameter === diameter
          ? { ...spec, weightPerMeter: newWeight }
          : spec
      )
    );
  };

  const updateRebarPrice = (diameter: number, newPrice: number) => {
    setRebarSpecs(prevSpecs =>
      prevSpecs.map(spec =>
        spec.diameter === diameter
          ? { ...spec, pricePerKg: newPrice }
          : spec
      )
    );
  };

  const svgPadding = 40;
  const svgSize = 240;
  const currentMaxDimension = Math.max(
    shapeType === 'rectangle' ? width : 0,
    shapeType === 'rectangle' ? height : 0,
    shapeType === 'L' || shapeType === 'U' ? arm1Length : 0,
    shapeType === 'L' ? arm2Length : 0,
    shapeType === 'U' ? arm3Length : 0,
    shapeType === 'U' && shapeType !== 'rectangle' ? width : 0, // width for U shape
    shapeType === 'rectangle' ? overlapLength : 0
  );
  
  const safeMaxDimension = currentMaxDimension > 0 ? currentMaxDimension : 1;

  const scale = (svgSize - svgPadding * 3) / safeMaxDimension;
  const startX = svgPadding * 1.5;
  const startY = svgPadding * 1.5;
  const overlapLineOffset = 2 * scale;

  const renderDimensionLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    offset: number = 20,
    position: 'above' | 'below' | 'right' | 'left' = 'above'
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    let labelX = midX;
    let labelY = midY;

    switch (position) {
      case 'above':
        labelX = midX - offset * Math.sin(angle);
        labelY = midY + offset * Math.cos(angle);
        break;
      case 'below':
        labelX = midX + offset * Math.sin(angle);
        labelY = midY - offset * Math.cos(angle);
        break;
      case 'right':
        labelX = midX + offset * Math.cos(angle);
        labelY = midY + offset * Math.sin(angle);
        break;
      case 'left':
        labelX = midX - offset * Math.cos(angle);
        labelY = midY - offset * Math.sin(angle);
        break;
    }

    return (
      <>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <line x1={x1 - 3 * Math.sin(angle)} y1={y1 + 3 * Math.cos(angle)} x2={x1 + 3 * Math.sin(angle)} y2={y1 - 3 * Math.cos(angle)} stroke="#6b7280" strokeWidth="1" />
        <line x1={x2 - 3 * Math.sin(angle)} y1={y2 + 3 * Math.cos(angle)} x2={x2 + 3 * Math.sin(angle)} y2={y2 - 3 * Math.cos(angle)} stroke="#6b7280" strokeWidth="1" />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600 font-medium"
        >
          {label} cm
        </text>
      </>
    );
  };

const renderShape = () => {
    const scaledOverlap = overlapLength * scale;
    const overlapAngle = Math.PI / 4;

    switch (shapeType) {
      case 'rectangle':
        const rectX = startX;
        const rectY = startY;
        const rectWidth = width * scale;
        const rectHeight = height * scale;

        const S = scaledOverlap;
        const cosA = Math.cos(overlapAngle);
        const sinA = Math.sin(overlapAngle);

        const dimLineStartX = rectX + rectWidth;
        const dimLineStartY = rectY;
        const dimLineEndX = dimLineStartX - S * cosA;
        const dimLineEndY = dimLineStartY + S * sinA;

        const halfTotalOffset = overlapLineOffset / 3;
        const perpOffsetX = halfTotalOffset * sinA;
        const perpOffsetY = halfTotalOffset * cosA;

        const line1StartX = dimLineStartX + perpOffsetX;
        const line1StartY = dimLineStartY + perpOffsetY;
        const line1EndX = dimLineEndX + perpOffsetX;
        const line1EndY = dimLineEndY + perpOffsetY;

        const line2StartX = dimLineStartX - perpOffsetX;
        const line2StartY = dimLineStartY - perpOffsetY;
        const line2EndX = dimLineEndX - perpOffsetX;
        const line2EndY = dimLineEndY - perpOffsetY;

        return (
          <>
            <rect
              x={rectX}
              y={rectY}
              width={rectWidth}
              height={rectHeight}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <path
              d={`M ${line1StartX} ${line1StartY} L ${line1EndX} ${line1EndY}`}
              stroke="#dc2626"
              strokeWidth="2"
            />
            <path
              d={`M ${line2StartX} ${line2StartY} L ${line2EndX} ${line2EndY}`}
              stroke="#dc2626"
              strokeWidth="2"
            />
            {renderDimensionLine(
              rectX,
              rectY - 10,
              rectX + rectWidth,
              rectY - 10,
              width.toString(),
              20,
              'above'
            )}
            {renderDimensionLine(
              rectX - 10,
              rectY,
              rectX - 10,
              rectY + rectHeight,
              height.toString(),
              10,
              'left'
            )}
            {renderDimensionLine(
              dimLineStartX,
              dimLineStartY,
              dimLineEndX,
              dimLineEndY,
              overlapLength.toString(),
              31,
              'below'
            )}
          </>
        );
      case 'L':
        return (
          <>
            <path
              d={`M ${startX} ${startY}
                 L ${startX + arm1Length * scale} ${startY}
                 L ${startX + arm1Length * scale} ${startY + arm2Length * scale}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />
            {renderDimensionLine(
              startX,
              startY - 10,
              startX + arm1Length * scale,
              startY - 10,
              arm1Length.toString(),
              10,
              'above'
            )}
            {renderDimensionLine(
              startX + arm1Length * scale + 10,
              startY,
              startX + arm1Length * scale + 10,
              startY + arm2Length * scale,
              arm2Length.toString(),
              10,
              'right'
            )}
          </>
        );
      case 'U':
        return (
          <>
            <path
              d={`M ${startX} ${startY}
                 L ${startX} ${startY + arm1Length * scale}
                 L ${startX + width * scale} ${startY + arm1Length * scale}
                 L ${startX + width * scale} ${startY + arm1Length * scale - arm3Length * scale}`}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />
            {renderDimensionLine(
              startX - 10,
              startY,
              startX - 10,
              startY + arm1Length * scale,
              arm1Length.toString(),
              10,
              'left'
            )}
            {renderDimensionLine(
              startX,
              startY + arm1Length * scale + 10,
              startX + width * scale,
              startY + arm1Length * scale + 10,
              width.toString(),
              10,
              'below'
            )}
            {renderDimensionLine(
              startX + width * scale + 10,
              startY + arm1Length * scale - arm3Length * scale,
              startX + width * scale + 10,
              startY + arm1Length * scale,
              arm3Length.toString(),
              10,
              'right'
            )}
          </>
        );
    }
  };
  const result = calculateShape();

  const offerPdfProps = {
    clientName,
    clientEmail,
    shapeType,
    diameter,
    overlapLength: shapeType === 'rectangle' ? overlapLength : undefined,
    width: (shapeType === 'rectangle' || shapeType === 'U') ? width : undefined,
    height: shapeType === 'rectangle' ? height : undefined,
    arm1Length: (shapeType === 'L' || shapeType === 'U') ? arm1Length : undefined,
    arm2Length: shapeType === 'L' ? arm2Length : undefined,
    arm3Length: shapeType === 'U' ? arm3Length : undefined,
    result,
    margin,
    numberOfItems, // <-- Pass numberOfItems to PDF
  };

  return (
    <div className={`min-h-screen bg-gray-100 p-4 ${isMaximized ? 'p-0' : ''}`}>
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isMaximized ? 'w-full m-0' : 'max-w-4xl mx-auto'}`}>
        <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <span className="font-semibold">Kalkulator Kosztów Zbrojenia</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="hover:bg-gray-700 p-1 rounded flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm">Drukuj</span>
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="hover:bg-gray-700 p-1 rounded"
            >
              {isMaximized ? <LucideLayoutTemplate className="w-4 h-4" /> : <LayoutTemplate className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Typ kształtu</h2>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShapeType('rectangle')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-2 ${
                    shapeType === 'rectangle' ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
                  } border`}
                >
                  <Square className="w-6 h-6" />
                  <span className="text-sm">Prostokąt</span>
                </button>
                <button
                  onClick={() => setShapeType('L')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-2 ${
                    shapeType === 'L' ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
                  } border`}
                >
                  <span className="text-2xl font-bold">L</span>
                  <span className="text-sm">Kształt L</span>
                </button>
                <button
                  onClick={() => setShapeType('U')}
                  className={`p-2 rounded-lg flex flex-col items-center gap-2 ${
                    shapeType === 'U' ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
                  } border`}
                >
                  <span className="text-2xl font-bold">U</span>
                  <span className="text-sm">Kształt U</span>
                </button>
              </div>
            </div>
            
            {/* Dimensions Inputs Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Wymiary i Ilość</h2>
                <div className={`grid gap-4 ${shapeType === 'rectangle' ? 'grid-cols-3' : (shapeType === 'U' ? 'grid-cols-3' : 'grid-cols-2')} mb-4`}>
                    {shapeType === 'rectangle' && (
                        <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Szerokość (cm)
                            </label>
                            <input
                            type="number"
                            value={width}
                            min="0"
                            onChange={(e) => setWidth(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Wysokość (cm)
                            </label>
                            <input
                            type="number"
                            value={height}
                            min="0"
                            onChange={(e) => setHeight(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Zakład (cm)
                            </label>
                            <input
                            type="number"
                            value={overlapLength}
                            min="0"
                            onChange={(e) => setOverlapLength(Math.max(0, Number(e.target.value)))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        </>
                    )}

                    {shapeType === 'L' && (
                        <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Ramię poziome (cm)
                            </label>
                            <input
                            type="number"
                            value={arm1Length}
                            min="0"
                            onChange={(e) => setArm1Length(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Ramię pionowe (cm)
                            </label>
                            <input
                            type="number"
                            value={arm2Length}
                            min="0"
                            onChange={(e) => setArm2Length(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        </>
                    )}

                    {shapeType === 'U' && (
                        <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Ramię lewe (cm)
                            </label>
                            <input
                            type="number"
                            value={arm1Length}
                            min="0"
                            onChange={(e) => setArm1Length(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Szerokość (cm)
                            </label>
                            <input
                            type="number"
                            value={width}
                            min="0"
                            onChange={(e) => setWidth(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                            Ramię prawe (cm)
                            </label>
                            <input
                            type="number"
                            value={arm3Length}
                            min="0"
                            onChange={(e) => setArm3Length(Number(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                            />
                        </div>
                        </>
                    )}
                </div>
                {/* Number of Items Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Liczba sztuk
                    </label>
                    <input
                        type="number"
                        value={numberOfItems}
                        min="1"
                        step="1"
                        onChange={(e) => setNumberOfItems(Math.max(1, parseInt(e.target.value, 10)))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                    />
                </div>
            </div>


            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Parametry prętów</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {rebarSpecs.map(spec => (
                  <div key={spec.diameter} className="bg-white p-3 rounded-lg border-2 border-gray-200">
                    <div className="text-center font-bold text-blue-600 mb-2">Φ {spec.diameter}</div>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.001"
                        value={spec.weightPerMeter}
                        onChange={(e) => updateRebarWeight(spec.diameter, Number(e.target.value))}
                        className="w-full text-sm p-1 border rounded"
                        placeholder="kg/mb"
                      />
                       <span className="text-xs text-gray-500 block text-center">kg/mb</span>
                      <input
                        type="number"
                        step="0.01"
                        value={spec.pricePerKg}
                        onChange={(e) => updateRebarPrice(spec.diameter, Number(e.target.value))}
                        className="w-full text-sm p-1 border rounded"
                        placeholder="zł/kg"
                      />
                       <span className="text-xs text-gray-500 block text-center">zł/kg</span>
                    </div>
                  </div>
                ))}
              </div>
            
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">
                          Średnica pręta (mm)
                      </label>
                      <select
                          value={diameter}
                          onChange={(e) => setDiameter(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                      >
                          {rebarSpecs.map(spec => (
                              <option key={spec.diameter} value={spec.diameter}>
                                  Φ {spec.diameter} ({spec.weightPerMeter.toFixed(3)} kg/mb)
                              </option>
                          ))}
                      </select>
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700">
                          Marża (%)
                      </label>
                      <select
                          value={margin}
                          onChange={(e) => setMargin(Number(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                      >
                          {MARGIN_STEPS.map(value => (
                              <option key={value} value={value}>
                                  {value}%
                              </option>
                          ))}
                      </select>
                  </div>
              </div>
            </div>


            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Dane klienta</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nazwa klienta
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                    placeholder="Nazwa firmy lub imię i nazwisko"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-2"
                    placeholder="adres@email.com"
                  />
                </div>
                
                <PDFDownloadLink
                  document={<OfferPDFDocument {...offerPdfProps} />}
                  fileName={`oferta-${clientName.replace(/\s+/g, '_') || 'klient'}-${new Date().toLocaleDateString('pl-PL')}.pdf`}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  {({ blob, url, loading, error }) =>
                    loading ? 'Generowanie PDF...' : (
                      <>
                        <Download className="w-4 h-4" />
                        Pobierz Ofertę PDF
                      </>
                    )
                  }
                </PDFDownloadLink>

              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Podgląd kształtu (1 szt.):</h2>
              <div className="flex justify-center mb-4">
                <svg width={svgSize} height={svgSize} className="bg-white border border-gray-200 rounded-lg">
                  {renderShape()}
                </svg>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Wynik kalkulacji (dla {numberOfItems} szt.):</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Długość 1 szt.: <span className="font-medium text-gray-900">{result.length.toFixed(2)} m</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Waga 1 szt.: <span className="font-medium text-gray-900">{result.weight.toFixed(2)} kg</span>
                  </p>
                   <p className="text-sm text-gray-600">
                    Waga całkowita ({numberOfItems} szt.): <span className="font-medium text-gray-900">{result.totalWeight.toFixed(2)} kg</span>
                  </p>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Rodzaj ceny</th>
                      <th className="text-right py-2">Kwota (łącznie)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Całkowita cena netto (bez marży)</td>
                      <td className="text-right font-medium">{result.totalNetCost.toFixed(2)} zł</td>
                    </tr>
                    <tr className="border-b text-gray-600">
                      <td className="py-2">Całkowita marża ({margin}%)</td>
                      <td className="text-right">{result.totalMarginAmount.toFixed(2)} zł</td>
                    </tr>
                    <tr className="border-b font-medium">
                      <td className="py-2">Całkowita cena netto z marżą</td>
                      <td className="text-right">{result.totalNetWithMargin.toFixed(2)} zł</td>
                    </tr>
                    <tr className="border-b text-gray-600">
                      <td className="py-2">Całkowity VAT (23%)</td>
                      <td className="text-right">{(result.totalGrossCost - result.totalNetWithMargin).toFixed(2)} zł</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-2">Całkowita cena brutto</td>
                      <td className="text-right">{result.totalGrossCost.toFixed(2)} zł</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {shapeType === 'rectangle' && (
              <div className="text-xs text-gray-500">
                * Zakład dla 1 szt.: {overlapLength} cm
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;