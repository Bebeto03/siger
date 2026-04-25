import { BaseResourceModel } from './base-resource.model';

export class User extends BaseResourceModel {
  name!: string;
  email!: string;
  password?: string;
  cpf!: string;
  phone?: string;
  type!: string;
  status!: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
