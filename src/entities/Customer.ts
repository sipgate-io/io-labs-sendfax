import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export default class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pin: number;
}
