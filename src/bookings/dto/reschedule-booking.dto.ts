export class RescheduleBookingDto {
  roomId?: string;
  newCheckIn: string;
  newCheckOut?: string;
  reason?: string;
  notifyGuest?: boolean;
}
