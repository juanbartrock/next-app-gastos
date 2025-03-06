import NextAuth from "next-auth/next"
import { options } from "./options"

// Handler de NextAuth con las opciones importadas
const handler = NextAuth(options)

// Exportar los handlers para GET y POST
export { handler as GET, handler as POST } 