import { BadRequestException } from '@nestjs/common';

// Política mínima para senha de conta com push em homologação/produção.
//
// Comprimento pesa mais que composição — é a orientação atual do NIST, e é
// por isso que o piso é 12 caracteres em vez dos "8 com símbolo" de sempre.
// A exigência de 3 das 4 classes é só uma segunda barreira, para não deixar
// passar "aaaaaaaaaaaa" (12 caracteres, uma classe só).
const CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];
const MIN_CARACTERES = 12;
const MIN_CLASSES = 3;

/** Lança BadRequestException com mensagem em pt-BR se a senha for fraca. */
export function validarSenhaForte(senha: unknown): void {
  if (typeof senha !== 'string' || senha.length < MIN_CARACTERES) {
    throw new BadRequestException(`A senha precisa ter pelo menos ${MIN_CARACTERES} caracteres.`);
  }
  const classes = CLASSES.filter((re) => re.test(senha)).length;
  if (classes < MIN_CLASSES) {
    throw new BadRequestException(
      'A senha precisa combinar pelo menos três tipos entre: maiúsculas, minúsculas, números e símbolos.',
    );
  }
}
