import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum OrderStatus {
  RECEIVED,
  PENDING,
  FULLFILLED,
  CANCELED,
}

@Entity()
export default class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: OrderStatus,
  })
  orderStatus: OrderStatus;
}
