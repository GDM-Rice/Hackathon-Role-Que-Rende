import { registerDecorator, type ValidationOptions } from 'class-validator';
import { moderar } from '../chat/moderacao.js';

// O username aparece para outras pessoas (lista de membros e título padrão do chat).
// Por isso passa pela mesma moderação das mensagens: nome de casa de aposta, link ou
// valor em dinheiro (ex.: "bet365", "site.com", "10k") não pode virar username.
export function UsernamePermitido(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'usernamePermitido',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'Este username não é permitido: não use nomes de casas de aposta, links ou valores.',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true; // @IsString cuida do tipo
          // "bet_365" e "bet-365" também precisam cair: os separadores viram espaço antes de moderar.
          const comoTexto = value.replace(/[._-]+/g, ' ');
          return !moderar(value).moderada && !moderar(comoTexto).moderada;
        },
      },
    });
  };
}
