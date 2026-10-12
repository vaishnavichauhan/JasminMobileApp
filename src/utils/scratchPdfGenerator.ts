import { Platform, Alert } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';

export interface PdfExportOptions {
  records: any[];
  summary?: any;
  startDate: string;
  endDate: string;
  activeTab: string;
  selectedBranches: string[];
  lastSync?: any;
}

// Format date time helper (IST)
const formatDateTime = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(val);
  }
};

// Format currency helper
const formatCurrency = (val: any): string => {
  const num = Number(val);
  if (val === null || val === undefined || isNaN(num) || String(val).trim() === '') {
    return '—';
  }
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Builds standard Landscape A4 HTML matching Jasmin-ERP Scratch & Win Reconciliation PDF format
 */
export const buildReconciliationHtml = ({
  records,
  summary,
  startDate,
  endDate,
  activeTab,
  selectedBranches,
  lastSync,
}: PdfExportOptions): string => {
  const totalDurationRecords = records.length;
  const durationMatched = records.filter(r => r.match_status === 'MATCHED').length;
  const durationPartial = records.filter(r => r.match_status === 'PARTIALLY_MATCHED').length;
  const durationNoScratch = records.filter(r => r.match_status === 'INVOICE_NOT_SCRATCHED').length;
  const durationWithoutInv = records.filter(r => r.match_status === 'WINNING_NO_INVOICE').length;
  const durationTotalPrizes = records.filter(
    r => Boolean(r.contest_prize && String(r.contest_prize).trim() !== '' && r.contest_prize !== '—')
  ).length;

  // Prize counts breakdown
  const durationPrizeCounts: Record<string, number> = {};
  records.forEach(r => {
    if (r.contest_prize && String(r.contest_prize).trim() !== '' && r.contest_prize !== '—') {
      const p = String(r.contest_prize).trim();
      durationPrizeCounts[p] = (durationPrizeCounts[p] || 0) + 1;
    }
  });
  const durationPrizeEntries = Object.entries(durationPrizeCounts).sort((a, b) => b[1] - a[1]);
  const durationPrizeBreakdownStr = durationPrizeEntries.map(([name, count]) => `${name}: ${count}`).join(', ');

  const generatedAtStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const tabLabelsMap: Record<string, string> = {
    ALL: 'All Records',
    MATCHED: 'Fully Matched',
    PARTIALLY_MATCHED: 'Partially Matched',
    INVOICE_NOT_SCRATCHED: 'Invoices Not Scratched',
    WINNING_NO_INVOICE: 'Winnings Without Invoice',
  };
  const tabLabel = tabLabelsMap[activeTab] || activeTab;

  const branchLabelText =
    selectedBranches.length > 0
      ? `Branches: ${selectedBranches.join(', ')}`
      : 'Branches: All Branches';

  // Group records by branch name (ascending alphabetical)
  const branchMap = new Map<string, { branchName: string; branchCode: string; sortKey: string; rows: any[] }>();

  records.forEach(row => {
    const bName = String(row.invoice_branch_name || row.contest_branch_name || '').trim();
    const bCode = String(row.invoice_branch_code || row.contest_branch_code || '').trim();
    const displayName = bName || (bCode ? `Branch ${bCode}` : 'Unassigned Branch');
    const displayCode = bCode || '—';
    const groupKey = displayName.toUpperCase();

    if (!branchMap.has(groupKey)) {
      branchMap.set(groupKey, {
        branchName: displayName,
        branchCode: displayCode,
        sortKey: groupKey,
        rows: [],
      });
    }
    branchMap.get(groupKey)!.rows.push(row);
  });

  const sortedBranches = Array.from(branchMap.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey, undefined, { numeric: true, sensitivity: 'base' })
  );

  let globalSrNo = 1;

  // Build rows HTML
  const branchSectionsHtml = sortedBranches
    .map((branchGroup, branchIdx) => {
      // Sort rows within branch by date
      branchGroup.rows.sort((a, b) => {
        const tA = new Date(a.invoice_datetime || a.contest_scratch_time || a.invoice_date || 0).getTime();
        const tB = new Date(b.invoice_datetime || b.contest_scratch_time || b.invoice_date || 0).getTime();
        return tA - tB;
      });

      const branchTotalVal = branchGroup.rows.reduce((sum, r) => {
        const v = Number(r.invoice_value);
        return !isNaN(v) ? sum + v : sum;
      }, 0);

      const branchMatched = branchGroup.rows.filter(r => r.match_status === 'MATCHED').length;
      const branchPartial = branchGroup.rows.filter(r => r.match_status === 'PARTIALLY_MATCHED').length;
      const branchNoScratch = branchGroup.rows.filter(r => r.match_status === 'INVOICE_NOT_SCRATCHED').length;
      const branchWithoutInv = branchGroup.rows.filter(r => r.match_status === 'WINNING_NO_INVOICE').length;
      const branchTotalPrizes = branchGroup.rows.filter(
        r => Boolean(r.contest_prize && String(r.contest_prize).trim() !== '' && r.contest_prize !== '—')
      ).length;

      const branchPrizeCounts: Record<string, number> = {};
      branchGroup.rows.forEach(r => {
        if (r.contest_prize && String(r.contest_prize).trim() !== '' && r.contest_prize !== '—') {
          const p = String(r.contest_prize).trim();
          branchPrizeCounts[p] = (branchPrizeCounts[p] || 0) + 1;
        }
      });
      const branchPrizeEntries = Object.entries(branchPrizeCounts).sort((a, b) => b[1] - a[1]);
      const branchPrizeBreakdownStr = branchPrizeEntries.map(([name, count]) => `${name}: ${count}`).join(', ');

      const rowsHtml = branchGroup.rows
        .map(row => {
          const sr = globalSrNo++;
          const bCode = row.invoice_branch_code || row.contest_branch_code || branchGroup.branchCode;
          const bName = row.invoice_branch_name || row.contest_branch_name || branchGroup.branchName;
          const branchCell = bName ? `<strong>${bCode}</strong><br/><span style="color:#64748B">${bName}</span>` : bCode;

          const erpCust =
            [row.invoice_customer_name, row.invoice_customer_phone].filter(Boolean).join('<br/>') || '—';
          const winCust =
            [row.contest_customer_name, row.contest_customer_phone].filter(Boolean).join('<br/>') || '—';

          const invDateTime = row.invoice_datetime
            ? formatDateTime(row.invoice_datetime)
            : row.invoice_date || '—';
          const scratchDateTime = row.contest_scratch_time
            ? formatDateTime(row.contest_scratch_time)
            : '—';

          const invVal = formatCurrency(row.invoice_value);
          const winId = row.contest_external_id || (row.contest_id ? `#${row.contest_id}` : '—');

          let rowBg = '#FFFFFF';
          let statusColor = '#475569';
          let statusBorder = '#CBD5E1';
          let statusLabel = row.match_status_label || row.match_status || '—';

          if (row.match_status === 'MATCHED') {
            rowBg = '#F0FDF4';
            statusColor = '#047857';
            statusBorder = '#A7F3D0';
            statusLabel = 'Fully Matched';
          } else if (row.match_status === 'PARTIALLY_MATCHED') {
            rowBg = '#F0F9FF';
            statusColor = '#0284C7';
            statusBorder = '#BAE6FD';
            statusLabel = 'Partially Matched';
          } else if (row.match_status === 'INVOICE_NOT_SCRATCHED') {
            rowBg = '#FFFBEB';
            statusColor = '#B45309';
            statusBorder = '#FDE68A';
            statusLabel = 'Not Scratched';
          } else if (row.match_status === 'WINNING_NO_INVOICE') {
            rowBg = '#FEF2F2';
            statusColor = '#BE123C';
            statusBorder = '#FECDD3';
            statusLabel = 'No Invoice Found';
          }

          return `
            <tr style="background-color: ${rowBg};">
              <td style="text-align: center; font-weight: bold; color: #64748B;">${sr}</td>
              <td style="text-align: center;">
                <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; color: ${statusColor}; border: 1px solid ${statusBorder};">
                  ${statusLabel}
                </span>
              </td>
              <td style="text-align: left;">${branchCell}</td>
              <td style="text-align: center; font-weight: bold; color: #1E293B;">${row.invoice_number || row.contest_invoice_number || '—'}</td>
              <td style="text-align: center; font-size: 8.5px;">${invDateTime}</td>
              <td style="text-align: left; font-size: 8.5px;">${erpCust}</td>
              <td style="text-align: right; font-weight: bold; color: #047857;">${invVal}</td>
              <td style="text-align: center; color: #475569;">${winId}</td>
              <td style="text-align: left; font-size: 8.5px;">${winCust}</td>
              <td style="text-align: left; font-weight: bold; color: #065F46;">${row.contest_prize || '—'}</td>
              <td style="text-align: center; font-size: 8.5px;">${scratchDateTime}</td>
              <td style="text-align: center; font-weight: bold; color: #475569;">${row.time_diff_human || '—'}</td>
            </tr>
          `;
        })
        .join('');

      return `
        <!-- Branch Header Row -->
        <tr style="background-color: #F1F5F9; font-weight: bold;">
          <td colspan="12" style="padding: 6px 10px; text-align: left; font-size: 9.5px; color: #0F172A; border-top: 2px solid #CBD5E1;">
            BRANCH: ${branchGroup.branchName.toUpperCase()} (${branchGroup.branchCode}) &nbsp;—&nbsp; ${branchGroup.rows.length} ${branchGroup.rows.length === 1 ? 'Record' : 'Records'}
          </td>
        </tr>
        ${rowsHtml}
        <!-- Branch Separation / Summary Row -->
        <tr style="background-color: #E2E8F0; font-weight: bold; font-size: 8.5px; color: #1E293B;">
          <td colspan="12" style="padding: 4px 10px; text-align: right;">
            --- End of ${branchGroup.branchName} (${branchGroup.branchCode}) | Total: ${branchGroup.rows.length} Records (Matched: ${branchMatched}, Partial: ${branchPartial}, No Scratch: ${branchNoScratch}, Without Invoice: ${branchWithoutInv}) | Branch Inv Value: ${formatCurrency(branchTotalVal)} ---
          </td>
        </tr>
        <!-- Branch Prizes Row -->
        <tr style="background-color: ${branchTotalPrizes > 0 ? '#FEF3C7' : '#F1F5F9'}; font-weight: bold; font-size: 8.5px; color: ${branchTotalPrizes > 0 ? '#92400E' : '#475569'};">
          <td colspan="12" style="padding: 4px 10px; text-align: right;">
            Branch Prizes: Total Prizes: ${branchTotalPrizes}${branchPrizeBreakdownStr ? ` | Prizes Won: ${branchPrizeBreakdownStr}` : ' (No Prizes Won)'}
          </td>
        </tr>
        <tr style="height: 6px;"><td colspan="12" style="border: none; background: #FFFFFF;"></td></tr>
      `;
    })
    .join('');

  // Grand Total Rows if multiple branches
  let grandTotalHtml = '';
  if (sortedBranches.length > 1) {
    const overallTotalInvVal = records.reduce((sum, r) => {
      const v = Number(r.invoice_value);
      return !isNaN(v) ? sum + v : sum;
    }, 0);

    grandTotalHtml = `
      <tr style="background-color: #CBD5E1; font-weight: bold; font-size: 9px; color: #0F172A;">
        <td colspan="12" style="padding: 6px 10px; text-align: right; border-top: 2px solid #94A3B8;">
          === REPORT GRAND TOTAL (${sortedBranches.length} Branches) | Total: ${totalDurationRecords} Records (Matched: ${durationMatched}, Partial: ${durationPartial}, No Scratch: ${durationNoScratch}, Without Invoice: ${durationWithoutInv}) | Overall Inv Value: ${formatCurrency(overallTotalInvVal)} ===
        </td>
      </tr>
      <tr style="background-color: ${durationTotalPrizes > 0 ? '#FDE68A' : '#E2E8F0'}; font-weight: bold; font-size: 9px; color: #78350F;">
        <td colspan="12" style="padding: 6px 10px; text-align: right;">
          === GRAND TOTAL PRIZES: ${durationTotalPrizes} | Prizes Won: ${durationPrizeBreakdownStr || 'No Prizes Won'} ===
        </td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Scratch & Win Reconciliation Report</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            color: #0F172A;
            background-color: #FFFFFF;
            font-size: 9px;
          }
          .header-banner {
            background-color: #0F172A;
            color: #FFFFFF;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 4px;
          }
          .header-title {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.3px;
          }
          .header-meta {
            font-size: 8.5px;
            color: #CBD5E1;
            text-align: right;
          }
          .info-bar {
            margin-top: 6px;
            margin-bottom: 6px;
            padding: 6px 10px;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            font-size: 8.5px;
            font-weight: bold;
          }
          .info-left {
            color: #334155;
          }
          .info-right {
            color: #0F172A;
          }
          .prizes-bar {
            margin-bottom: 8px;
            padding: 5px 10px;
            background-color: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: bold;
            color: #B45309;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          th {
            background-color: #1E293B;
            color: #FFFFFF;
            padding: 6px 4px;
            font-size: 8.5px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #334155;
          }
          td {
            padding: 4.5px 4px;
            border: 1px solid #E2E8F0;
            vertical-align: middle;
          }
          .footer {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <!-- Header Banner -->
        <div class="header-banner">
          <div class="header-title">Jasmin ERP - Scratch & Win Contest vs Invoice Reconciliation</div>
          <div class="header-meta">Generated: ${generatedAtStr}</div>
        </div>

        <!-- Info Bar Line 1 -->
        <div class="info-bar">
          <div class="info-left">
            Date Range: ${startDate} to ${endDate} &nbsp;|&nbsp; Status: ${tabLabel} &nbsp;|&nbsp; ${branchLabelText}
          </div>
          <div class="info-right">
            Total: ${totalDurationRecords} Records (Matched: ${durationMatched}, Partial: ${durationPartial}, No Scratch: ${durationNoScratch}, Without Invoice: ${durationWithoutInv})
          </div>
        </div>

        <!-- Info Bar Line 2: Prizes Duration Breakdown -->
        <div class="prizes-bar">
          ${
            durationTotalPrizes > 0
              ? `Total Prizes for Duration: ${durationTotalPrizes.toLocaleString('en-IN')} &nbsp;|&nbsp; Prizes Won: ${durationPrizeBreakdownStr}`
              : 'Total Prizes for Duration: 0 (No prizes won during this duration)'
          }
        </div>

        <!-- Data Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">Sr</th>
              <th style="width: 10%;">Status</th>
              <th style="width: 10%;">Branch</th>
              <th style="width: 10%;">Invoice No</th>
              <th style="width: 10%;">Invoice Date/Time</th>
              <th style="width: 11%;">ERP Customer</th>
              <th style="width: 9%;">Inv Value</th>
              <th style="width: 6%;">Win ID</th>
              <th style="width: 11%;">Contest Customer</th>
              <th style="width: 10%;">Prize Won</th>
              <th style="width: 10%;">Scratch Time</th>
              <th style="width: 9%;">Time Diff</th>
            </tr>
          </thead>
          <tbody>
            ${branchSectionsHtml}
            ${grandTotalHtml}
          </tbody>
        </table>

        <!-- Page Footer -->
        <div class="footer">
          <div>Jasmin ERP | Scratch & Win Reconciliation Report | Authorized Branch Access Only</div>
          <div>Report generated via Mobile App</div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generates and downloads the PDF report using react-native-html-to-pdf and react-native-blob-util
 */
export const downloadReconciliationPdf = async (options: PdfExportOptions): Promise<string> => {
  if (!options.records || options.records.length === 0) {
    throw new Error('No records available to export.');
  }

  const cleanTab = options.activeTab.toLowerCase().replace(/_/g, '-');
  const fileName = `Scratch_Win_Reconciliation_${cleanTab}_${options.startDate}_to_${options.endDate}`;

  // 1. Build landscape HTML string
  const htmlContent = buildReconciliationHtml(options);

  // 2. Generate PDF using react-native-html-to-pdf
  const pdfResult = await generatePDF({
    html: htmlContent,
    fileName: fileName,
    directory: 'Documents',
    shouldPrintBackgrounds: true,
  });

  if (!pdfResult || !pdfResult.filePath) {
    throw new Error('PDF generation failed to produce a valid file.');
  }

  const generatedPath = pdfResult.filePath;
  let finalPath = generatedPath;

  // 3. On Android, copy to public Downloads directory using react-native-blob-util
  if (Platform.OS === 'android') {
    const fullFileName = `${fileName}.pdf`;
    const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir;
    const targetPath = `${downloadDir}/${fullFileName}`;

    try {
      // Copy to public Download directory
      await ReactNativeBlobUtil.fs.cp(generatedPath, targetPath);
      finalPath = targetPath;

      // Scan file so it is indexed and immediately visible in Download manager and Files app
      try {
        await ReactNativeBlobUtil.fs.scanFile([{ path: targetPath, mime: 'application/pdf' }]);
      } catch (scanErr) {
        console.warn('scanFile notice:', scanErr);
      }

      // Also copy to MediaStore for Android 10+
      try {
        if (ReactNativeBlobUtil.MediaCollection) {
          await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
            {
              name: fullFileName,
              parentFolder: '',
              mimeType: 'application/pdf',
            },
            'Download',
            targetPath
          );
        }
      } catch (mediaErr) {
        console.warn('MediaCollection notice:', mediaErr);
      }
    } catch (copyErr) {
      console.warn('Direct Download copy error, using generated path:', copyErr);
      finalPath = generatedPath;
    }
  }

  return finalPath;
};

/**
 * Helper to launch the native PDF viewer on Android or iOS
 */
export const openPdfFile = (filePath: string) => {
  try {
    if (Platform.OS === 'android') {
      ReactNativeBlobUtil.android.actionViewIntent(filePath, 'application/pdf');
    } else if (Platform.OS === 'ios') {
      ReactNativeBlobUtil.ios.openDocument(filePath);
    }
  } catch (openErr: any) {
    Alert.alert('Notice', 'Could not launch PDF viewer. The file is saved in your Downloads folder.');
  }
};

/**
 * Helper to prompt the user to view the generated PDF file
 */
export const promptOpenPdf = (filePath: string, fileName: string) => {
  Alert.alert(
    '✅ PDF Downloaded',
    `Report saved to Downloads:\n\n${fileName}\n\nWould you like to open it now?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open PDF',
        onPress: () => openPdfFile(filePath),
      },
    ]
  );
};
