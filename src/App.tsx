import React, { useState, useRef } from 'react';
import { Calculator, Square, LucideLayoutTemplate, LayoutTemplate, Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface CalculationResult {
  length: number;
  weight: number;
  netCost: number;
  marginAmount: number;
  netWithMargin: number;
  grossCost: number;
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
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
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
  
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const calculateShape = (): CalculationResult => {
    const selectedRebar = rebarSpecs.find(spec => spec.diameter === diameter)!;
    let shapeLength = 0;
    
    switch (shapeType) {
      case 'rectangle':
        shapeLength = ((width * 2 + height * 2) + 10) / 100;
        break;
      case 'L':
        shapeLength = (arm1Length + arm2Length) / 100;
        break;
      case 'U':
        shapeLength = (arm1Length + width + arm3Length) / 100;
        break;
    }
    
    const weight = shapeLength * selectedRebar.weightPerMeter;
    const netCost = weight * selectedRebar.pricePerKg;
    const marginAmount = netCost * (margin / 100);
    const netWithMargin = netCost + marginAmount;
    const grossCost = netWithMargin * (1 + VAT_RATE);
    
    return {
      length: shapeLength,
      weight,
      netCost,
      marginAmount,
      netWithMargin,
      grossCost
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

  // SVG rendering parameters
  const svgPadding = 40;
  const svgSize = 240;
  const maxDimension = Math.max(
    width,
    height,
    arm1Length,
    arm2Length,
    arm3Length
  );
  
  const scale = (svgSize - svgPadding * 3) / maxDimension;
  const startX = svgPadding * 1.5;
  const startY = svgPadding * 1.5;

  const renderDimensionLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    label: string,
    offset: number = 20,
    position: 'above' | 'below' | 'right' = 'above'
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
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
        labelX = midX + offset;
        labelY = midY;
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
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          className="text-xs fill-gray-600 font-medium"
        >
          {label} cm
        </text>
      </>
    );
  };

  const renderShape = () => {
    switch (shapeType) {
      case 'rectangle':
        return (
          <>
            <rect
              x={startX}
              y={startY}
              width={width * scale}
              height={height * scale}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <path
              d={`M ${startX + width * scale} ${startY} L ${startX + width * scale - 10 * scale * Math.cos(Math.PI/4)} ${startY + 10 * scale * Math.sin(Math.PI/4)}`}
              stroke="#dc2626"
              strokeWidth="2"
            />
            {renderDimensionLine(
              startX,
              startY - 10,
              startX + width * scale,
              startY - 10,
              width.toString(),
              20,
              'above'
            )}
            {renderDimensionLine(
              startX - 20,
              startY,
              startX - 20,
              startY + height * scale,
              height.toString()
            )}
            {renderDimensionLine(
              startX + width * scale,
              startY,
              startX + width * scale - 10 * scale * Math.cos(Math.PI/4),
              startY + 10 * scale * Math.sin(Math.PI/4),
              '10',
              15,
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
              startY - 20,
              startX + arm1Length * scale,
              startY - 20,
              arm1Length.toString(),
              20,
              'above'
            )}
            {renderDimensionLine(
              startX + arm1Length * scale + 20,
              startY,
              startX + arm1Length * scale + 20,
              startY + arm2Length * scale,
              arm2Length.toString(),
              0,
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
              startX - 20,
              startY,
              startX - 20,
              startY + arm1Length * scale,
              arm1Length.toString()
            )}
            {renderDimensionLine(
              startX,
              startY + arm1Length * scale + 20,
              startX + width * scale,
              startY + arm1Length * scale + 20,
              width.toString()
            )}
            {renderDimensionLine(
              startX + width * scale + 20,
              startY + arm1Length * scale - arm3Length * scale,
              startX + width * scale + 20,
              startY + arm1Length * scale,
              arm3Length.toString(),
              0,
              'right'
            )}
          </>
        );
    }
  };

  const result = calculateShape();

  const generateOffer = () => {
    const date = new Date().toLocaleDateString('pl-PL');
    const offerContent = `
OFERTA CENOWA - ${date}

Szanowny/a ${clientName},

Dziękujemy za zainteresowanie naszą ofertą. Poniżej przedstawiamy szczegóły wyceny:

SPECYFIKACJA:
- Typ kształtu: ${shapeType === 'rectangle' ? 'Prostokąt' : shapeType === 'L' ? 'Kształt L' : 'Kształt U'}
- Średnica pręta: Φ${diameter}mm
- Długość całkowita: ${result.length.toFixed(2)}m
- Waga: ${result.weight.toFixed(2)}kg

KOSZTY:
1. Cena netto (bez marży): ${result.netCost.toFixed(2)} zł
2. Marża (${margin}%): ${result.marginAmount.toFixed(2)} zł
3. Cena netto z marżą: ${result.netWithMargin.toFixed(2)} zł
4. VAT (23%): ${(result.grossCost - result.netWithMargin).toFixed(2)} zł
5. Cena końcowa brutto: ${result.grossCost.toFixed(2)} zł

Oferta ważna przez 14 dni od daty wystawienia.

Z poważaniem,
Zespół Kalkulatora Kosztów Zbrojenia
    `;

    const blob = new Blob([offerContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oferta-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen bg-gray-100 p-4 ${isMaximized ? 'p-0' : ''}`}>
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isMaximized ? 'w-full h-screen m-0' : 'max-w-4xl mx-auto'}`}>
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

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Parametry prętów</h2>
              <div className="grid grid-cols-4 gap-4">
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
                      <input
                        type="number"
                        step="0.01"
                        value={spec.pricePerKg}
                        onChange={(e) => updateRebarPrice(spec.diameter, Number(e.target.value))}
                        className="w-full text-sm p-1 border rounded"
                        placeholder="zł/kg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {shapeType === 'rectangle' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Szerokość (cm)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wysokość (cm)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
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
                      onChange={(e) => setArm1Length(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ramię pionowe (cm)
                    </label>
                    <input
                      type="number"
                      value={arm2Length}
                      onChange={(e) => setArm2Length(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
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
                      onChange={(e) => setArm1Length(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Szerokość (cm)
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ramię prawe (cm)
                    </label>
                    <input
                      type="number"
                      value={arm3Length}
                      onChange={(e) => setArm3Length(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Średnica pręta (mm)
                </label>
                <select
                  value={diameter}
                  onChange={(e) => setDiameter(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                >
                  {rebarSpecs.map(spec => (
                    <option key={spec.diameter} value={spec.diameter}>
                      Φ {spec.diameter} ({spec.weightPerMeter} kg/mb)
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50 p-2"
                >
                  {MARGIN_STEPS.map(value => (
                    <option key={value} value={value}>
                      {value}%
                    </option>
                  ))}
                </select>
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
                <button
                  onClick={generateOffer}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Generuj ofertę
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Podgląd kształtu:</h2>
              <div className="flex justify-center mb-4">
                <svg width={svgSize} height={svgSize} className="bg-white border border-gray-200 rounded-lg">
                  {renderShape()}
                </svg>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Wynik kalkulacji:</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Długość całkowita: <span className="font-medium text-gray-900">{result.length.toFixed(2)} m</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Waga: <span className="font-medium text-gray-900">{result.weight.toFixed(2)} kg</span>
                  </p>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Rodzaj ceny</th>
                      <th className="text-right py-2">Kwota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Cena netto (bez marży)</td>
                      <td className="text-right font-medium">{result.netCost.toFixed(2)} zł</td>
                    </tr>
                    <tr className="border-b text-gray-600">
                      <td className="py-2">Marża ({margin}%)</td>
                      <td className="text-right">{result.marginAmount.toFixed(2)} zł</td>
                    </tr>
                    <tr className="border-b font-medium">
                      <td className="py-2">Cena netto z marżą</td>
                      <td className="text-right">{result.netWithMargin.toFixed(2)} zł</td>
                    </tr>
                    <tr className="border-b text-gray-600">
                      <td className="py-2">VAT (23%)</td>
                      <td className="text-right">{(result.grossCost - result.netWithMargin).toFixed(2)} zł</td>
                    </tr>
                    <tr className="font-semibold">
                      <td className="py-2">Cena brutto</td>
                      <td className="text-right">{result.grossCost.toFixed(2)} zł</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {shapeType === 'rectangle' && (
              <div className="text-xs text-gray-500">
                * Zakład stały: 10 cm
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;