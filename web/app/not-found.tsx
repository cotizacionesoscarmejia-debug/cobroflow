import { Proximamente } from '@/components/landing/Proximamente';

export default function NotFound() {
  return (
    <Proximamente
      titulo="Esta página no existe"
      detalle="El enlace puede estar mal escrito o la pantalla todavía no está lista. Revisa la dirección o vuelve al inicio."
    />
  );
}
