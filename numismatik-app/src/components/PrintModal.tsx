import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Printer, ExternalLink, Coins, Banknote } from 'lucide-react';
import { Coin } from '../types';
import { formatCurrency } from '../utils/storage';
import { getRarityOption } from '../data/rarities';
import { NativePrint } from '../utils/nativePrint';

interface PrintModalProps {
  isOpen: boolean;
  coins: Coin[];
  onClose: () => void;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeImageSrc(url?: string): string {
  const trimmed = (url || '').trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed;
  }
  return '';
}

function previewFrame(coin: Coin): string {
  const src = safeImageSrc(coin.imageUrl) || safeImageSrc(coin.reverseImageUrl);
  const isBanknote = coin.itemType === 'banknote';
  if (!src) {
    return `<div style="width:${isBanknote ? '56px' : '40px'};height:${isBanknote ? '36px' : '40px'};border-radius:${isBanknote ? '4px' : '50%'};background:#e2e8f0;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:10px;">–</div>`;
  }
  const shape = isBanknote
    ? 'width:56px;height:36px;border-radius:4px;'
    : 'width:40px;height:40px;border-radius:50%;';
  return `<img src="${escapeHtml(src)}" alt="" style="${shape}object-fit:cover;display:block;background:#f1f5f9;" />`;
}

function CatalogThumb({ coin }: { coin: Coin }) {
  const src = safeImageSrc(coin.imageUrl) || safeImageSrc(coin.reverseImageUrl);
  const isBanknote = coin.itemType === 'banknote';
  const shape = isBanknote
    ? 'h-9 w-14 rounded'
    : 'h-10 w-10 rounded-full';
  if (!src) {
    return (
      <div className={`${shape} shrink-0 bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]`}>
        –
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={`${shape} shrink-0 object-cover bg-slate-100`}
    />
  );
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, coins, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState('');

  if (!isOpen) return null;

  const totalPositions = coins.length;
  const totalPieces = coins.reduce((sum, c) => sum + (c.quantity || 1), 0);
  const totalCost = coins.reduce((sum, c) => sum + ((c.purchasePrice || 0) * (c.quantity || 1)), 0);
  const totalValue = coins.reduce((sum, c) => sum + ((c.currentValue || 0) * (c.quantity || 1)), 0);

  const handleOpenNewWindowAndPrint = async () => {
    setPrintError('');
    const rowsHtml = coins.map((coin, index) => {
      const rarityOpt = getRarityOption(coin.rarity);
      const rarityLabel = rarityOpt ? rarityOpt.fullLabel : (coin.rarity || '-');
      const isBanknote = coin.itemType === 'banknote';
      const qty = coin.quantity || 1;
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #1e293b;">#${escapeHtml(coin.catalogNumber || '---')}</td>
          <td style="padding: 4px 6px;">${previewFrame(coin)}</td>
          <td style="padding: 6px 8px; color: #334155;">${isBanknote ? 'Banknote' : 'Münze'}</td>
          <td style="padding: 6px 8px; font-weight: bold; text-align: center; color: #0f172a;">${qty}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: #0f172a;">${escapeHtml(coin.name)}</td>
          <td style="padding: 6px 8px; color: #334155;">${escapeHtml(coin.country || '-')} (${escapeHtml(coin.year || '-')})</td>
          <td style="padding: 6px 8px; color: #334155;">${escapeHtml(coin.faceValue || '-')} ${escapeHtml(coin.currency || '')}</td>
          <td style="padding: 6px 8px; color: #334155;">${escapeHtml(coin.condition || '-')}</td>
          <td style="padding: 6px 8px; color: #334155; font-size: 11px;">${escapeHtml(rarityLabel)}</td>
          <td style="padding: 6px 8px; color: #475569;">${escapeHtml(coin.storageLocation || '-')}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; color: #334155;">${escapeHtml(formatCurrency(coin.purchasePrice || 0))}</td>
          <td style="padding: 6px 8px; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${escapeHtml(formatCurrency(coin.currentValue || 0))}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <title>Numismatischer Bestandskatalog - ${new Date().toLocaleDateString('de-CH')}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 15px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 4px 0;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }
          .stats {
            text-align: right;
            font-size: 11px;
          }
          .stats-val {
            font-weight: bold;
            font-family: monospace;
            font-size: 13px;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #0f172a;
            padding: 8px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #334155;
          }
          tfoot tr {
            background-color: #e2e8f0;
            border-top: 2px solid #0f172a;
            font-weight: bold;
          }
          tfoot td {
            padding: 8px;
          }
          @media print {
            .no-print-btn { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 15px;" class="no-print-btn">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
            🖨️ Druckdialog jetzt öffnen / als PDF speichern
          </button>
        </div>

        <div class="header">
          <div>
            <h1 class="title">Numismatische Sammlung & Bestandskatalog</h1>
            <p class="subtitle">
              Gedruckt am: ${new Date().toLocaleDateString('de-CH')} um ${new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
              • Enthaltene Positionen: ${totalPositions} (${totalPieces} Stk.)
            </p>
          </div>
          <div class="stats">
            <div>Gesamtwert: <span class="stats-val">${formatCurrency(totalValue)}</span></div>
            <div style="color: #64748b;">Anschaffung: ${formatCurrency(totalCost)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID #</th>
              <th>Bild</th>
              <th>Typ</th>
              <th style="text-align: center;">Stk.</th>
              <th>Bezeichnung</th>
              <th>Land (Jahr)</th>
              <th>Nominal</th>
              <th>Erhaltung</th>
              <th>Rarity</th>
              <th>Lagerort</th>
              <th style="text-align: right;">Kaufpreis</th>
              <th style="text-align: right;">Schätzwert</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL</td>
              <td style="text-align: center;">${totalPieces}</td>
              <td colspan="6" style="text-align: right; color: #475569;">${totalPositions} Positionen insgesamt</td>
              <td style="text-align: right; font-family: monospace;">${formatCurrency(totalCost)}</td>
              <td style="text-align: right; font-family: monospace; font-size: 12px; color: #0f172a;">${formatCurrency(totalValue)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    if (Capacitor.getPlatform() === 'ios') {
      setIsPrinting(true);
      try {
        await NativePrint.print({
          html: htmlContent,
          jobName: `Numismatik-Katalog ${new Date().toLocaleDateString('de-CH')}`,
        });
      } catch (error) {
        console.error('Native print failed:', error);
        setPrintError('Der iOS-Druckdialog konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.');
      } finally {
        setIsPrinting(false);
      }
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#181a22] sm:border sm:border-amber-500/30 sm:rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col text-slate-100 h-full sm:h-auto sm:max-h-[92vh]"
        id="print-preview-modal"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 bg-[#121318] shrink-0 space-y-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-serif font-bold text-slate-100 leading-tight">
                Druckansicht &amp; Katalog-Export
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vorschau Ihrer gefilterten Münzen und Banknoten.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Schliessen"
              className="p-2 -mr-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Kennzahlen */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Positionen</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{totalPositions}</div>
            </div>
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Stück</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{totalPieces}</div>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-amber-500/80">Gesamtwert</div>
              <div className="text-sm font-bold text-amber-300 font-mono truncate">{formatCurrency(totalValue)}</div>
            </div>
          </div>

          <button
            onClick={handleOpenNewWindowAndPrint}
            disabled={isPrinting}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>In neuem Druck-Fenster öffnen / PDF</span>
          </button>
        </div>

        {/* Modal Body - Document Preview */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-950/50 overscroll-contain">
          <div className="bg-white text-slate-900 rounded-xl p-4 sm:p-8 shadow-xl border border-slate-300 max-w-full font-sans">
            {/* Catalog Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-slate-900 pb-4 mb-4 gap-2">
              <div>
                <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  Numismatische Sammlung &amp; Bestandskatalog
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-1">
                  Erstellt am: {new Date().toLocaleDateString('de-CH')} • {totalPositions} Positionen ({totalPieces} Stück)
                </p>
              </div>
              <div className="sm:text-right text-xs shrink-0">
                <div className="font-bold text-sm text-slate-900 font-mono">
                  Gesamtwert: {formatCurrency(totalValue)}
                </div>
                <div className="text-slate-600 font-mono">
                  Anschaffung: {formatCurrency(totalCost)}
                </div>
              </div>
            </div>

            {/* Mobile: Kartenliste statt breiter Tabelle */}
            <ul className="space-y-2.5 sm:hidden">
              {coins.map((coin) => {
                const rarityOpt = getRarityOption(coin.rarity);
                const isBanknote = coin.itemType === 'banknote';
                return (
                  <li key={coin.id} className="rounded-lg border border-slate-300 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <CatalogThumb coin={coin} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-slate-900 leading-snug break-words">
                          {coin.name}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          {isBanknote ? <Banknote className="w-3 h-3" /> : <Coins className="w-3 h-3" />}
                          <span>{coin.country || '-'}{coin.year ? ` (${coin.year})` : ''}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-[13px] font-bold text-slate-900">
                          {formatCurrency(coin.currentValue || 0)}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          Kauf: {formatCurrency(coin.purchasePrice || 0)}
                        </div>
                      </div>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] border-t border-slate-200 pt-2">
                      <div className="flex gap-1">
                        <dt className="text-slate-500">ID</dt>
                        <dd className="font-mono text-slate-800 truncate">#{coin.catalogNumber || '---'}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="text-slate-500">Stk.</dt>
                        <dd className="font-semibold text-slate-800">{coin.quantity || 1}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="text-slate-500">Nominal</dt>
                        <dd className="text-slate-800 truncate">{coin.faceValue || '-'} {coin.currency || ''}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="text-slate-500">Erhaltung</dt>
                        <dd className="text-slate-800 truncate">{coin.condition || '-'}</dd>
                      </div>
                      <div className="flex gap-1 col-span-2">
                        <dt className="text-slate-500">Seltenheit</dt>
                        <dd className="text-slate-800 truncate">{rarityOpt ? rarityOpt.fullLabel : (coin.rarity || '-')}</dd>
                      </div>
                      <div className="flex gap-1 col-span-2">
                        <dt className="text-slate-500">Lagerort</dt>
                        <dd className="text-slate-800 truncate">{coin.storageLocation || '-'}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>

            {/* Mobile Summe */}
            <div className="sm:hidden mt-4 rounded-lg bg-slate-900 text-slate-50 p-3 flex items-center justify-between">
              <div className="text-[11px]">
                <div className="font-bold uppercase tracking-wide">Total</div>
                <div className="text-slate-300">{totalPositions} Positionen • {totalPieces} Stk.</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold">{formatCurrency(totalValue)}</div>
                <div className="text-[10px] text-slate-300">Kauf: {formatCurrency(totalCost)}</div>
              </div>
            </div>

            {/* Desktop/Tablet: Tabelle */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] uppercase font-bold text-slate-700">
                    <th className="p-2 border border-slate-300">ID #</th>
                    <th className="p-2 border border-slate-300">Bild</th>
                    <th className="p-2 border border-slate-300">Typ</th>
                    <th className="p-2 border border-slate-300 text-center">Stk.</th>
                    <th className="p-2 border border-slate-300">Bezeichnung</th>
                    <th className="p-2 border border-slate-300">Land (Jahr)</th>
                    <th className="p-2 border border-slate-300">Nominal</th>
                    <th className="p-2 border border-slate-300">Erhaltung</th>
                    <th className="p-2 border border-slate-300">Seltenheit</th>
                    <th className="p-2 border border-slate-300">Lagerort</th>
                    <th className="p-2 border border-slate-300 text-right">Kaufpreis</th>
                    <th className="p-2 border border-slate-300 text-right">Schätzwert</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, idx) => {
                    const rarityOpt = getRarityOption(coin.rarity);
                    const isBanknote = coin.itemType === 'banknote';
                    return (
                      <tr key={coin.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">
                          #{coin.catalogNumber || '---'}
                        </td>
                        <td className="p-2 border border-slate-300">
                          <CatalogThumb coin={coin} />
                        </td>
                        <td className="p-2 border border-slate-300">
                          {isBanknote ? 'Banknote' : 'Münze'}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">
                          {coin.quantity || 1}
                        </td>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">
                          {coin.name}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-800">
                          {coin.country} {coin.year ? `(${coin.year})` : ''}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-800">
                          {coin.faceValue} {coin.currency}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-800">
                          {coin.condition || '-'}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-800 font-medium">
                          {rarityOpt ? rarityOpt.fullLabel : (coin.rarity || '-')}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-700">
                          {coin.storageLocation || '-'}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono text-slate-700">
                          {formatCurrency(coin.purchasePrice || 0)}
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(coin.currentValue || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 border-t-2 border-slate-900 font-bold text-slate-900">
                    <td colSpan={3} className="p-2 border border-slate-300">TOTAL</td>
                    <td className="p-2 border border-slate-300 text-center">{totalPieces}</td>
                    <td colSpan={6} className="p-2 border border-slate-300 text-right font-normal text-slate-700">
                      {totalPositions} Positionen insgesamt
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-sm text-slate-900">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-[#121318] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {printError && (
            <p className="mb-2 text-xs text-rose-300" role="alert">{printError}</p>
          )}
          <p className="hidden sm:block text-xs text-slate-400 mb-3">
            Tipp: <strong className="text-amber-300 font-semibold">"In neuem Druck-Fenster öffnen"</strong> liefert das beste Druckergebnis und speichert als PDF.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Schliessen
            </button>
            <button
              onClick={handleOpenNewWindowAndPrint}
              disabled={isPrinting}
              className="flex-[2] sm:flex-none px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Druckdialog öffnet …' : 'Drucken / PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
