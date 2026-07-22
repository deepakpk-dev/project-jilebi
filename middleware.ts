import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './src/i18n/routing'
import { updateSession } from './src/utils/supabase/middleware'

const handleI18nRouting = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  return updateSession(request, handleI18nRouting(request))
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
