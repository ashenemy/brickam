import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import type { AnalyticsDashboard } from '../@types';

/**
 * Экспорт дашборда аналитики в CSV и XLSX (Foundations §14, Stage 15).
 * CSV — плоский текст; XLSX — книга exceljs с листами Summary/Revenue/TopProducts.
 */
@Injectable()
export class AnalyticsExportService {
    /**
     * CSV дашборда: блок временного ряда (date,gmv,orders) и итоговая сводка
     * (gmv,orders,avgCheck). Разделитель — запятая, перевод строки — \n.
     */
    exportCsv(dashboard: AnalyticsDashboard): string {
        const lines: string[] = [];
        lines.push('date,gmv,orders');
        for (const bucket of dashboard.revenueSeries) {
            lines.push(`${bucket.date},${bucket.gmv},${bucket.orders}`);
        }
        lines.push('');
        lines.push('gmv,orders,avgCheck');
        const { gmv, orders, avgCheck } = dashboard.summary;
        lines.push(`${gmv},${orders},${avgCheck}`);
        return lines.join('\n');
    }

    /**
     * XLSX дашборда: лист Summary (сводка), Revenue (временной ряд) и
     * TopProducts (топ-товары). Возвращает буфер книги для отдачи в ответе.
     */
    async exportXlsx(dashboard: AnalyticsDashboard): Promise<Buffer> {
        const workbook = new Workbook();

        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'GMV', key: 'gmv' },
            { header: 'Orders', key: 'orders' },
            { header: 'AvgCheck', key: 'avgCheck' },
        ];
        summarySheet.addRow(dashboard.summary);

        const revenueSheet = workbook.addWorksheet('Revenue');
        revenueSheet.columns = [
            { header: 'Date', key: 'date' },
            { header: 'GMV', key: 'gmv' },
            { header: 'Orders', key: 'orders' },
        ];
        for (const bucket of dashboard.revenueSeries) {
            revenueSheet.addRow(bucket);
        }

        const topSheet = workbook.addWorksheet('TopProducts');
        topSheet.columns = [
            { header: 'ProductId', key: 'productId' },
            { header: 'Qty', key: 'qty' },
            { header: 'Revenue', key: 'revenue' },
        ];
        for (const product of dashboard.topProducts) {
            topSheet.addRow(product);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}
