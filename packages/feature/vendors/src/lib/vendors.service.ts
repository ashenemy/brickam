import { ForbiddenException, NotFoundException } from '@brickam/core-kit';
import { Injectable } from '@nestjs/common';
import type { VendorContract } from '../@types';
import type { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import type { VendorDocument } from './vendor.schema';
import { VendorsRepository } from './vendors.repository';

/**
 * Сервис вендоров (Foundations §15, Stage 15). Публичный профиль (getById/
 * getBySlug), кабинет владельца (getMine/updateProfile) и денормализация
 * рейтинга из reviews (recomputeRating). Границы feature: только kit/domain.
 */
@Injectable()
export class VendorsService {
    constructor(private readonly vendorsRepository: VendorsRepository) {}

    /** Маппит документ вендора в плоский контракт. */
    private toContract(doc: VendorDocument): VendorContract {
        const contract: VendorContract = {
            id: doc.id ?? doc._id.toString(),
            slug: doc.slug,
            name: doc.name,
            ownerUserId: doc.ownerUserId,
            region: doc.region,
            status: doc.status,
            ratingAvg: doc.ratingAvg,
            ratingCount: doc.ratingCount,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.display !== undefined) {
            contract.display = doc.display;
        }
        if (doc.city !== undefined) {
            contract.city = doc.city;
        }
        if (doc.logo !== undefined) {
            contract.logo = doc.logo;
        }
        return contract;
    }

    /** Вендор по идентификатору (для внутренних связок). */
    async getById(id: string): Promise<VendorContract> {
        const doc = await this.vendorsRepository.findById(id);
        if (!doc) {
            throw new NotFoundException('errors.vendors.notFound');
        }
        return this.toContract(doc);
    }

    /** Публичный профиль вендора по slug. */
    async getBySlug(slug: string): Promise<VendorContract> {
        const doc = await this.vendorsRepository.findBySlug(slug);
        if (!doc) {
            throw new NotFoundException('errors.vendors.notFound');
        }
        return this.toContract(doc);
    }

    /** Кабинет текущего владельца (vendorId из @CurrentVendor). */
    async getMine(vendorId: string): Promise<VendorContract> {
        return this.getById(vendorId);
    }

    /** Обновляет профиль вендора (вызывается только владельцем — контроллер). */
    async updateProfile(vendorId: string, dto: UpdateVendorDto): Promise<VendorContract> {
        const updated = await this.vendorsRepository.updateById(vendorId, { ...dto });
        if (!updated) {
            throw new NotFoundException('errors.vendors.notFound');
        }
        return this.toContract(updated);
    }

    /** Создаёт вендора (онбординг/админ). owner назначается вызывающим. */
    async create(ownerUserId: string, dto: CreateVendorDto): Promise<VendorContract> {
        const existing = await this.vendorsRepository.findBySlug(dto.slug);
        if (existing) {
            throw new ForbiddenException('errors.vendors.slugTaken');
        }
        const created = await this.vendorsRepository.create({ ...dto, ownerUserId });
        return this.toContract(created);
    }

    /**
     * Денормализует агрегат рейтинга вендора (вызывает reviews после пересчёта).
     * Заглушка-метод: пишет среднее/количество в документ вендора.
     */
    async recomputeRating(vendorId: string, avg: number, count: number): Promise<void> {
        await this.vendorsRepository.updateById(vendorId, {
            ratingAvg: avg,
            ratingCount: count,
        });
    }
}
