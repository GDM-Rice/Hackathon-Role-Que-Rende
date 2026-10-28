import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        // Só autentica se houver usuário: servidores locais (ex.: MailHog) não usam login,
        // e mandar credenciais vazias faz o envio falhar.
        ...(this.config.get<string>('SMTP_USER') && {
          auth: {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASS'),
          },
        }),
      });
    }
  }

  async enviarRecuperacaoSenha(para: string, link: string) {
    // Sem SMTP configurado, só em desenvolvimento mostramos o link no console.
    // Em produção o link é uma credencial (quem o tem redefine a senha): nunca vai para o log.
    if (!this.transporter) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP não configurado em produção.');
      }
      this.logger.warn(`SMTP não configurado. Link de recuperação de ${para}: ${link}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to: para,
      subject: 'Recuperação de senha',
      text:
        `Recebemos um pedido para redefinir sua senha.\n\n` +
        `Acesse o link abaixo (válido por 30 minutos):\n${link}\n\n` +
        `Se não foi você, ignore este e-mail.`,
    });
  }
}