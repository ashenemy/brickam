import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { InvoicesApiService } from './invoices-api.service';
import type { CreateInvoicePayload, Invoice } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
        id: 'inv1',
        invoiceNumber: 'INV-001',
        chatId: 'c1',
        buyerId: 'b1',
        lineItems: [{ title: 'Cement', qty: 2, price: 5000 }],
        subtotal: 10000,
        total: 9000,
        currency: 'AMD',
        status: 'draft',
        validUntil: '2026-07-01',
        ...overrides,
    };
}

describe('InvoicesApiService', () => {
    let service: InvoicesApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(InvoicesApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('create шлёт POST /invoices с телом и парсит data', () => {
        const payload: CreateInvoicePayload = {
            chatId: 'c1',
            buyerId: 'b1',
            lineItems: [{ title: 'Cement', qty: 2, price: 5000 }],
            discount: { type: 'percent', value: 10 },
            validUntil: '2026-07-01',
        };
        let result: Invoice | undefined;
        service.create(payload).subscribe((inv) => (result = inv));

        const req = httpMock.expectOne('http://api.test/api/invoices');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);
        req.flush({ success: true, data: mockInvoice() });

        expect(result?.id).toBe('inv1');
        expect(result?.invoiceNumber).toBe('INV-001');
    });

    it('send шлёт POST /invoices/:id/send и возвращает обновлённый инвойс', () => {
        let result: Invoice | undefined;
        service.send('inv1').subscribe((inv) => (result = inv));

        const req = httpMock.expectOne('http://api.test/api/invoices/inv1/send');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: mockInvoice({ status: 'sent' }) });

        expect(result?.status).toBe('sent');
    });

    it('pdfUrl строит ссылку на PDF', () => {
        expect(service.pdfUrl('inv1')).toBe('http://api.test/api/invoices/inv1/pdf');
    });
});
