# Routes (Next.js 15)
/                          -> Landing
/auth/login                -> Login
/auth/signup               -> Signup
/dashboard                 -> Role-aware shell
  /student
    /requests              -> list
    /requests/new          -> create
    /requests/[id]         -> detail (accept, pay)
    /pay/[sessionId]       -> pay page (client init, server action)
    /payment/success       -> verify & redirect
    /sessions              -> list (paid only)
    /sessions/[id]         -> guarded session page (chat placeholder)
    /profile               -> profile
  /teacher
    /requests              -> list
    /requests/[id]         -> proposal
    /sessions              -> list (paid only)
    /sessions/[id]         -> guarded session page
    /profile               -> profile
  /admin
    /users                 -> manage
    /requests              -> list
    /requests/[id]         -> invite/monitor
