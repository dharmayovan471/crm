import { Injectable } from '@nestjs/common';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadCreateDto, LeadUpdateDto } from '../dto/lead.dto';

@Injectable()
export class LeadService {
  constructor(private readonly leadRepository: LeadRepository) {}

  async create(dto: LeadCreateDto, userId: string) {
    const { products, ...leadData } = dto;
    return this.leadRepository.create(leadData, products, userId);
  }

  async findAll(query?: string, statusId?: string) {
    return this.leadRepository.findAll(query, statusId);
  }

  async findOne(id: string) {
    return this.leadRepository.findById(id);
  }

  async update(id: string, dto: LeadUpdateDto, userId: string) {
    const { products, ...leadData } = dto;
    return this.leadRepository.update(id, leadData, products, userId);
  }

  async remove(id: string) {
    return this.leadRepository.delete(id);
  }

  async getMap() {
    return this.leadRepository.getMapCoordinates();
  }

  async getStatuses() {
    return this.leadRepository.getStatuses();
  }
}
