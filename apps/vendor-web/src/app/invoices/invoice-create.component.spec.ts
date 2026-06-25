import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { InvoiceCreateComponent } from './invoice-create.component';
import type { DiscountType, Invoice } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

/** Доступ к protected-полям компонента для проверок. */
type Probe = {
    chatId: { set(v: string): void };
    buyerId: { set(v: string): void };
    validUntil: { set(v: string): void };
    discountType: { set(v: DiscountType): void };
    discountValue: { set(v: string): void };
    lineItems: () => unknown[];
    subtotal: () => number;
    total: () => number;
    created: () => Invoice | null;
    addRow(): void;
    removeRow(i: number): void;
    updateRow(i: number, key: 'title' | 'qty' | 'price', v: string): void;
    create(): void;
    send(): void;
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

describe('InvoiceCreateComponent', () => {
    let fixture: ComponentFixture<InvoiceCreateComponent>;
    let probe: Probe;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InvoiceCreateComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InvoiceCreateComponent);
        probe = fixture.componentInstance as unknown as Probe;
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('добавление и удаление позиций меняет список', () => {
        expect(probe.lineItems().length).toBe(1);
        probe.addRow();
        expect(probe.lineItems().length).toBe(2);
        probe.removeRow(0);
        expect(probe.lineItems().length).toBe(1);
    });

    it('subtotal и total считаются корректно с процентной скидкой', () => {
        probe.updateRow(0, 'qty', '2');
        probe.updateRow(0, 'price', '5000');
        expect(probe.subtotal()).toBe(10000);

        probe.discountType.set('percent');
        probe.discountValue.set('10');
        expect(probe.total()).toBe(9000);
    });

    it('total учитывает скидку фиксированной суммой и не уходит ниже нуля', () => {
        probe.updateRow(0, 'qty', '1');
        probe.updateRow(0, 'price', '1000');
        probe.discountType.set('amount');
        probe.discountValue.set('300');
        expect(probe.total()).toBe(700);

        probe.discountValue.set('5000');
        expect(probe.total()).toBe(0);
    });

    it('create вызывает api.create, после успеха send вызывает api.send', () => {
        probe.chatId.set('c1');
        probe.buyerId.set('b1');
        probe.validUntil.set('2026-07-01');
        probe.updateRow(0, 'title', 'Cement');
        probe.updateRow(0, 'qty', '2');
        probe.updateRow(0, 'price', '5000');

        probe.create();
        const createReq = httpMock.expectOne('http://api.test/api/invoices');
        expect(createReq.request.method).toBe('POST');
        expect(createReq.request.body.chatId).toBe('c1');
        expect(createReq.request.body.lineItems.length).toBe(1);
        createReq.flush({ success: true, data: mockInvoice() });

        expect(probe.created()?.id).toBe('inv1');

        probe.send();
        const sendReq = httpMock.expectOne('http://api.test/api/invoices/inv1/send');
        expect(sendReq.request.method).toBe('POST');
        sendReq.flush({ success: true, data: mockInvoice({ status: 'sent' }) });

        expect(probe.created()?.status).toBe('sent');
    });
});
