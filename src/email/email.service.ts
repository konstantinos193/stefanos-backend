import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface BookingEmailData {
  guestName: string;
  guestEmail: string;
  bookingId: string;
  propertyName: string;
  roomName?: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  currency: string;
  refundAmount?: number;
  refundPercentage?: number;
  cancellationReason?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be skipped. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Incanto Hotel" <noreply@incanto.gr>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err instanceof Error ? err.message : err}`);
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('el-GR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  private nights(checkIn: Date, checkOut: Date): number {
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  }

  async sendBookingConfirmation(data: BookingEmailData): Promise<void> {
    const nights = this.nights(data.checkIn, data.checkOut);
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#1e293b;border-radius:12px;overflow:hidden;">
    <div style="background:#4f46e5;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Η Κράτησή σας Επιβεβαιώθηκε!</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;font-size:15px;">Booking #${data.bookingId.slice(-8).toUpperCase()}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Αγαπητέ/ή ${data.guestName},</p>
      <p style="color:#cbd5e1;font-size:15px;margin:0 0 24px;">
        Η κράτησή σας έχει επιβεβαιωθεί. Σας περιμένουμε!
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:24px;margin:24px 0;">
        <h2 style="color:#e2e8f0;font-size:16px;margin:0 0 16px;border-bottom:1px solid #1e293b;padding-bottom:12px;">
          Λεπτομέρειες Κράτησης
        </h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Ακίνητο</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${data.propertyName}${data.roomName ? ` — ${data.roomName}` : ''}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Check-in</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${this.formatDate(data.checkIn)}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Check-out</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${this.formatDate(data.checkOut)}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Διάρκεια</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${nights} ${nights === 1 ? 'βράδυ' : 'βράδια'}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Επισκέπτες</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${data.guests}</td></tr>
          <tr style="border-top:1px solid #1e293b;">
            <td style="color:#94a3b8;padding:12px 0 6px;font-size:15px;font-weight:600;">Σύνολο</td>
            <td style="color:#6366f1;font-size:18px;font-weight:700;text-align:right;padding:12px 0 6px;">${data.currency} ${data.totalPrice.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      <p style="color:#64748b;font-size:13px;margin:24px 0 0;">
        Για ερωτήσεις ή αλλαγές επικοινωνήστε μαζί μας στο
        <a href="mailto:info@incanto.gr" style="color:#6366f1;">info@incanto.gr</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;

    await this.send(data.guestEmail, `✅ Επιβεβαίωση Κράτησης #${data.bookingId.slice(-8).toUpperCase()} — ${data.propertyName}`, html);
  }

  async sendBookingCancellation(data: BookingEmailData): Promise<void> {
    const refundLine = data.refundAmount && data.refundAmount > 0
      ? `<tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Επιστροφή χρημάτων</td><td style="color:#4ade80;font-size:14px;text-align:right;">${data.currency} ${data.refundAmount.toFixed(2)} (${data.refundPercentage}%)</td></tr>`
      : `<tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Επιστροφή χρημάτων</td><td style="color:#f87171;font-size:14px;text-align:right;">Χωρίς επιστροφή</td></tr>`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#1e293b;border-radius:12px;overflow:hidden;">
    <div style="background:#dc2626;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Ακύρωση Κράτησης</h1>
      <p style="color:#fca5a5;margin:8px 0 0;font-size:15px;">Booking #${data.bookingId.slice(-8).toUpperCase()}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#94a3b8;font-size:15px;margin:0 0 16px;">Αγαπητέ/ή ${data.guestName},</p>
      <p style="color:#cbd5e1;font-size:15px;margin:0 0 24px;">
        Η κράτησή σας έχει ακυρωθεί.${data.cancellationReason ? ` Λόγος: ${data.cancellationReason}` : ''}
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:24px;margin:24px 0;">
        <h2 style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Λεπτομέρειες Ακύρωσης</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Ακίνητο</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${data.propertyName}${data.roomName ? ` — ${data.roomName}` : ''}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Check-in</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${this.formatDate(data.checkIn)}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Check-out</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${this.formatDate(data.checkOut)}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Ποσό κράτησης</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${data.currency} ${data.totalPrice.toFixed(2)}</td></tr>
          ${refundLine}
        </table>
      </div>
      ${data.refundAmount && data.refundAmount > 0 ? `<p style="color:#4ade80;font-size:14px;">Η επιστροφή θα εμφανιστεί στον λογαριασμό σας εντός 5-10 εργάσιμων ημερών.</p>` : ''}
    </div>
  </div>
</div>
</body>
</html>`;

    await this.send(data.guestEmail, `❌ Ακύρωση Κράτησης #${data.bookingId.slice(-8).toUpperCase()} — ${data.propertyName}`, html);
  }

  async sendCheckInReminder(data: BookingEmailData): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#1e293b;border-radius:12px;overflow:hidden;">
    <div style="background:#059669;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Υπενθύμιση Άφιξης</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;font-size:15px;">Check-in αύριο!</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#94a3b8;font-size:15px;margin:0 0 16px;">Αγαπητέ/ή ${data.guestName},</p>
      <p style="color:#cbd5e1;font-size:15px;margin:0 0 24px;">
        Σας υπενθυμίζουμε ότι αύριο είναι η ημέρα άφιξής σας στο <strong style="color:#e2e8f0;">${data.propertyName}</strong>!
      </p>
      <div style="background:#0f172a;border-radius:8px;padding:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Check-in</td><td style="color:#34d399;font-size:15px;font-weight:600;text-align:right;">${this.formatDate(data.checkIn)}</td></tr>
          <tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Check-out</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${this.formatDate(data.checkOut)}</td></tr>
          ${data.roomName ? `<tr><td style="color:#64748b;padding:6px 0;font-size:14px;">Δωμάτιο</td><td style="color:#e2e8f0;font-size:14px;text-align:right;">${data.roomName}</td></tr>` : ''}
        </table>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

    await this.send(data.guestEmail, `🏨 Υπενθύμιση: Check-in αύριο στο ${data.propertyName}`, html);
  }
}
