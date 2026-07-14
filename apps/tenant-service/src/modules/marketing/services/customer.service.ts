import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../repositories/customer.repository';
import { CustomerCreateDto, CustomerUpdateDto } from '../dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(dto: CustomerCreateDto) {
    return this.customerRepository.create(dto);
  }

  async findAll() {
    return this.customerRepository.findAll();
  }

  async findOne(id: string) {
    return this.customerRepository.findById(id);
  }

  async update(id: string, dto: CustomerUpdateDto) {
    return this.customerRepository.update(id, dto);
  }

  async getMap() {
    return this.customerRepository.getMapCoordinates();
  }
}
