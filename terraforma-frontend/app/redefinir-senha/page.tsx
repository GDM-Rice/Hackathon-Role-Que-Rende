import Prototipo from '@/components/Prototipo';

// Destino do link do e-mail de recuperação (o back monta FRONTEND_URL/redefinir-senha?token=...).
// O motor lê o token e abre o login no modo "senha nova".
export default function RedefinirSenha() {
  return <Prototipo />;
}
