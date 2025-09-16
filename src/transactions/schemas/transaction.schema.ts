import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ObjectIdType } from "../../types/object-id.type";

export enum TransactionState {
  CREATED = 1, // Транзакция успешно создана, ожидание подтверждения
  PERFORMED = 2, // Транзакция успешно завершена
  CANCELLED = -1, // Транзакция отменена
  CANCELLED_AFTER_PERFORMED = -2, // Транзакция отменена после завершения
}

export enum TransactionReason {
  RECEIVER_NOT_FOUND = 1, // Один или несколько получателей не найдены или неактивны
  DEBIT_ERROR = 2, // Ошибка при выполнении дебетовой операции в процессинговом центре
  TRANSACTION_ERROR = 3, // Ошибка выполнения транзакции
  TIMEOUT = 4, // Транзакция отменена по таймауту
  REFUND = 5, // Возврат денег
  UNKNOWN_ERROR = 10, // Неизвестная ошибка
}

export enum ReceiptState {
  CREATED = 0, // Чек создан. Ожидание подтверждения оплаты
  FIRST_CHECK = 1, // Первая стадия проверок. Создание транзакции в биллинге мерчанта
  DEBIT = 2, // Списание денег с карты
  CLOSE_TRANSACTION = 3, // Закрытие транзакции в биллинге мерчанта
  PAID = 4, // Чек оплачен
  HELD = 5, // Чек захолдирован
  HOLD_COMMAND = 6, // Получение команды на ходирование чека
  MANUAL_INTERVENTION = 20, // Чек стоит на паузе для ручного вмешательства
  CANCEL_QUEUE = 21, // Чек в очереди на отмену
  CLOSE_QUEUE = 30, // Чек в очереди на закрытие транзакции в биллинге мерчанта
  CANCELLED = 50, // Чек отменен
}

export interface Receiver {
  id: string; // Идентификатор кассы
  amount: number; // Сумма платежа в тийинах
}

export interface Account {
  orderId?: string; // ID заказа в системе мерчанта
  userId?: string; // ID пользователя
  phone?: string; // Номер телефона (для мобильных операторов)
  login?: string; // Логин (для интернет провайдеров)
  user?: string; // Пользователь (для интернет магазинов)
  order?: string; // Заказ (для интернет магазинов)
  [key: string]: any; // Дополнительные поля для расширяемости
}

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true, unique: true })
  id: string; // ID транзакции Payme Business (24 символа)

  @Prop({ required: true })
  time: number; // Время создания транзакции Payme Business (Timestamp)

  @Prop({ required: true })
  amount: number; // Сумма платежа в тийинах

  @Prop({ type: Object, required: true })
  account: Account; // Счет покупателя

  @Prop({ required: true })
  create_time: number; // Время добавления транзакции в биллинге мерчанта

  @Prop({ default: null })
  perform_time?: number; // Время проведения транзакции в биллинге мерчанта

  @Prop({ default: null })
  cancel_time?: number; // Время отмены транзакции в биллинге мерчанта

  @Prop({ default: null })
  transaction?: string; // Номер или идентификатор транзакции в биллинге мерчанта

  @Prop({
    enum: [
      TransactionState.CREATED,
      TransactionState.PERFORMED,
      TransactionState.CANCELLED,
      TransactionState.CANCELLED_AFTER_PERFORMED,
    ],
    default: TransactionState.CREATED,
  })
  state: TransactionState; // Состояние транзакции

  @Prop({
    enum: [
      TransactionReason.RECEIVER_NOT_FOUND,
      TransactionReason.DEBIT_ERROR,
      TransactionReason.TRANSACTION_ERROR,
      TransactionReason.TIMEOUT,
      TransactionReason.REFUND,
      TransactionReason.UNKNOWN_ERROR,
    ],
    default: null,
  })
  reason?: TransactionReason; // Причина отмены транзакции

  @Prop({ type: [Object], default: [] })
  receivers?: Receiver[]; // Список получателей

  // Дополнительные поля для интеграции с нашей системой
  @Prop({ type: "ObjectId", ref: "Order", default: null })
  orderId?: ObjectIdType; // Связь с заказом в нашей системе

  @Prop({ type: "ObjectId", ref: "User", default: null })
  userId?: ObjectIdType; // Связь с пользователем в нашей системе

  @Prop({ type: "ObjectId", ref: "Plan", default: null })
  planId?: ObjectIdType; // Связь с планом в нашей системе

  @Prop({ default: null })
  merchantTransactionId?: string; // ID транзакции в нашей системе мерчанта

  @Prop({ default: null })
  description?: string; // Описание транзакции

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // Дополнительные данные

  // Поля для отслеживания состояния чека
  @Prop({
    enum: [
      ReceiptState.CREATED,
      ReceiptState.FIRST_CHECK,
      ReceiptState.DEBIT,
      ReceiptState.CLOSE_TRANSACTION,
      ReceiptState.PAID,
      ReceiptState.HELD,
      ReceiptState.HOLD_COMMAND,
      ReceiptState.MANUAL_INTERVENTION,
      ReceiptState.CANCEL_QUEUE,
      ReceiptState.CLOSE_QUEUE,
      ReceiptState.CANCELLED,
    ],
    default: ReceiptState.CREATED,
  })
  receiptState?: ReceiptState; // Состояние чека

  @Prop({ default: null })
  receiptId?: string; // ID чека в системе Payme

  @Prop({ default: null })
  receiptUrl?: string; // URL чека для пользователя

  // Поля для логирования и отладки
  @Prop({ default: null })
  lastError?: string; // Последняя ошибка

  @Prop({ default: 0 })
  retryCount?: number; // Количество попыток обработки

  @Prop({ default: null })
  lastProcessedAt?: Date; // Время последней обработки
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Индексы для оптимизации запросов
TransactionSchema.index({ id: 1 }, { unique: true });
TransactionSchema.index({ orderId: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ planId: 1 });
TransactionSchema.index({ state: 1 });
TransactionSchema.index({ receiptState: 1 });
TransactionSchema.index({ create_time: -1 });
TransactionSchema.index({ perform_time: -1 });
TransactionSchema.index({ cancel_time: -1 });
TransactionSchema.index({ "account.orderId": 1 });
TransactionSchema.index({ merchantTransactionId: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ updatedAt: -1 });
