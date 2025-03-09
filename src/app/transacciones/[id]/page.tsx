import DetalleGastoClient from "./DetalleGastoClient"

// Este es un componente del servidor que simplemente pasa los parámetros 
// al componente cliente que maneja la lógica interactiva
export default function DetalleGastoPage({ params }: { params: { id: string } }) {
  return <DetalleGastoClient gastoId={params.id} />
} 