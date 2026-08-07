import { ServiceCard } from '@/components/ServiceCard';
import { LandingScene } from '@/components/landing/LandingScene';
import { SiteHeader } from '@/components/landing/SiteHeader';
import { apiFetch } from '@/server/api';
import type { Service } from '@dejatellevar/contracts';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ServiceList = { data: Service[]; next_cursor: string | null };

/** Roles con los que alguien puede identificarse al registrarse (ProfileType). */
const ROLES = [
  {
    rol: 'client',
    title: 'Soy cliente',
    desc: 'Descubre y reserva experiencias en toda Colombia, con el Índice de Fidelidad de tu lado.',
    cta: 'Crear mi cuenta',
  },
  {
    rol: 'business',
    title: 'Soy empresa',
    desc: 'Publica y opera tu negocio: agenda, cobros y reseñas. Y contrata creadores para crecer.',
    cta: 'Registrar mi negocio',
  },
  {
    rol: 'creator',
    title: 'Soy creador',
    desc: 'Monetiza tu audiencia: recibe solicitudes de marcas y cobra por resultados reales.',
    cta: 'Unirme como creador',
  },
] as const;

async function getTopByFidelity(): Promise<Service[]> {
  try {
    const res = await apiFetch<ServiceList>('/v1/services?sort=fidelity&limit=6');
    return res.data;
  } catch {
    return [];
  }
}

/** Una escena de la narrativa: ocupa la altura de la ventana, fondo transparente
 *  para dejar ver la escena 3D detrás. El texto es HTML real (accesible + SEO). */
function Scene({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-screen items-center px-6 py-24 md:px-12">
      <div className="mx-auto max-w-3xl">
        {kicker && (
          <p className="mb-4 font-mono text-sm uppercase tracking-widest text-lila">{kicker}</p>
        )}
        <h2 className="font-display text-3xl leading-tight text-paja md:text-4xl">{title}</h2>
        <div className="mt-5 space-y-4 font-body text-lg leading-relaxed text-paja/75">
          {children}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const services = await getTopByFidelity();

  return (
    <>
      {/* Escena de partículas fija de fondo (cliente, con fallback estático). */}
      <LandingScene />

      <main className="relative z-10">
        <SiteHeader />

        {/* NARRATIVA — el scroll transforma las partículas sección a sección. */}
        <div id="landing-narrative">
          {/* Hero */}
          <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-sm uppercase tracking-widest text-lila">
              Bogotá · Toda Colombia
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] text-paja md:text-7xl">
              Sabes qué vas a recibir <span className="text-lila">antes de pagar.</span>
            </h1>
            <p className="mt-6 max-w-2xl font-body text-lg text-paja/75 md:text-xl">
              DéjateLlevar es el sistema operativo de las experiencias y los creadores de Colombia.
              Descubre, reserva y paga — con un dato de honestidad que nadie más te da.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/buscar"
                className="h-12 rounded-full bg-violeta px-7 font-body font-medium leading-[3rem] text-white transition-opacity hover:opacity-90"
              >
                Explorar servicios
              </Link>
              <a
                href="#fidelidad"
                className="h-12 rounded-full border border-lila/40 px-7 font-body font-medium leading-[3rem] text-paja transition-colors hover:bg-white/5"
              >
                Cómo funciona
              </a>
            </div>
            <p className="mt-16 animate-pulse font-mono text-xs uppercase tracking-widest text-paja/50">
              Desliza ↓
            </p>
          </section>

          {/* Ruta / descubrimiento */}
          <Scene kicker="Descubre" title="Toda Colombia, en un solo lugar.">
            <p>
              De una cena para dos a una sesión de fotos, de un tour de aventura a la peluquería del
              barrio: miles de experiencias en Bogotá y todo el país, buscables y reservables desde
              un mismo lugar.
            </p>
            <p>
              Agenda con disponibilidad real, paga en línea y lleva todo tu historial contigo. Sin
              llamadas, sin “te confirmo”, sin sorpresas.
            </p>
          </Scene>

          {/* Índice de Fidelidad */}
          <section id="fidelidad" className="flex min-h-screen items-center px-6 py-24 md:px-12">
            <div className="mx-auto max-w-3xl">
              <p className="mb-4 font-mono text-sm uppercase tracking-widest text-lila">
                El diferenciador
              </p>
              <h2 className="font-display text-3xl leading-tight text-paja md:text-4xl">
                El Índice de Fidelidad: <span className="text-lila">Expectativa vs Realidad.</span>
              </h2>
              <div className="mt-5 space-y-4 font-body text-lg leading-relaxed text-paja/75">
                <p>
                  Después de vivir un servicio, quien lo contrató califica de{' '}
                  <strong>−3 a +3</strong> qué tan fiel fue a lo prometido. El promedio es un dato
                  público que puedes ver antes de reservar.
                </p>
                <p>
                  No son estrellas infladas: es honestidad medible. Los negocios que cumplen lo que
                  prometen suben; los que exageran, se notan.
                </p>
              </div>

              {/* Leyenda del eje, coherente con el FidelityMeter */}
              <div className="mt-8 flex items-center justify-between font-mono text-xs text-paja/60">
                <span>−3 · prometió de más</span>
                <span>0 · exacto</span>
                <span>+3 · superó</span>
              </div>
              <div
                className="mt-2 h-2 w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, #8c2f39 0%, rgba(255,255,255,0.35) 50%, #3f8f5c 100%)',
                }}
              />
            </div>
          </section>

          {/* B2C + B2B */}
          <section className="flex min-h-screen items-center px-6 py-24 md:px-12">
            <div className="mx-auto max-w-4xl">
              <p className="mb-4 font-mono text-sm uppercase tracking-widest text-lila">
                Un mercado de dos lados
              </p>
              <h2 className="font-display text-3xl leading-tight text-paja md:text-4xl">
                Dos públicos, una sola plataforma.
              </h2>
              <p className="mt-5 max-w-2xl font-body text-lg leading-relaxed text-paja/75">
                DéjateLlevar conecta a quien busca una experiencia con quien la ofrece — y suma una
                capa de creadores para que los negocios crezcan.
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {/* B2C */}
                <div className="rounded-2xl border border-lila/25 bg-white/5 p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-lila">B2C</p>
                  <h3 className="mt-2 font-display text-2xl text-paja">Para las personas</h3>
                  <p className="mt-3 font-body text-paja/75">
                    Descubre y reserva experiencias en todo el país. Paga en línea, agenda con
                    disponibilidad real y confía en el Índice de Fidelidad antes de decidir.
                  </p>
                  <p className="mt-4 font-body text-sm text-paja/60">
                    Cliente ↓ experiencia · reserva · reseña honesta
                  </p>
                </div>

                {/* B2B */}
                <div className="rounded-2xl border border-lila/25 bg-white/5 p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-lila">B2B</p>
                  <h3 className="mt-2 font-display text-2xl text-paja">Para los negocios</h3>
                  <p className="mt-3 font-body text-paja/75">
                    Publica y opera tu negocio: agenda, cobros, reseñas y campañas. Y{' '}
                    <strong className="text-paja">contrata creadores de contenido</strong> para
                    promocionar tus servicios, con propuestas y atribución reales.
                  </p>
                  <p className="mt-4 font-body text-sm text-paja/60">
                    Empresa ↓ publica · contrata creadores · mide resultados
                  </p>
                </div>
              </div>

              <p className="mt-8 font-body text-paja/70">
                En medio, los <strong className="text-paja">creadores de contenido</strong> son el
                puente: los negocios los contratan y ellos llevan clientes nuevos. Todo se opera
                desde la plataforma, con IA nativa e interoperabilidad total.
              </p>
            </div>
          </section>

          {/* Cierre / CTA */}
          <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <h2 className="max-w-3xl font-display text-4xl leading-tight text-paja md:text-5xl">
              Déjate llevar por Colombia.
            </h2>
            <p className="mt-5 max-w-xl font-body text-lg text-paja/75">
              Empieza a explorar los servicios mejor calificados por fidelidad.
            </p>
            <Link
              href="/buscar"
              className="mt-8 h-12 rounded-full bg-violeta px-8 font-body font-medium leading-[3rem] text-white transition-opacity hover:opacity-90"
            >
              Explorar servicios
            </Link>
          </section>
        </div>

        {/* SECCIÓN OPACA — cubre la escena; datos reales de la API. */}
        <div className="relative bg-bg">
          {/* Apartado de identidad: registrarse / entrar según el rol. */}
          <section id="empezar" className="border-b border-border px-6 py-20 md:px-12">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <p className="font-mono text-sm uppercase tracking-widest text-violeta">
                  Empieza ahora
                </p>
                <h2 className="mt-3 font-display text-3xl text-text">
                  ¿Cómo vas a usar DéjateLlevar?
                </h2>
                <p className="mt-3 font-body text-text-muted">
                  Elige tu rol y crea tu cuenta en un minuto.
                </p>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {ROLES.map((r) => (
                  <Link
                    key={r.rol}
                    href={`/registro?rol=${r.rol}`}
                    className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-violeta"
                  >
                    <span className="font-mono text-xs uppercase tracking-widest text-violeta">
                      {r.rol === 'client' ? 'B2C' : 'B2B'}
                    </span>
                    <h3 className="mt-2 font-display text-xl text-text">{r.title}</h3>
                    <p className="mt-2 flex-1 font-body text-sm text-text-muted">{r.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 font-body text-sm font-medium text-violeta group-hover:gap-2">
                      {r.cta} <span aria-hidden>→</span>
                    </span>
                  </Link>
                ))}
              </div>

              <p className="mt-8 text-center font-body text-sm text-text-muted">
                ¿Ya tienes cuenta?{' '}
                <Link href="/entrar" className="font-medium text-violeta hover:underline">
                  Entra aquí
                </Link>
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-6 py-20 md:px-12">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl text-text">Mejor calificados por fidelidad</h2>
              <Link
                href="/buscar?sort=fidelity"
                className="font-body text-sm text-violeta hover:underline"
              >
                Ver todos
              </Link>
            </div>

            {services.length === 0 ? (
              <p className="mt-6 rounded-md border border-border bg-surface p-6 font-body text-text-muted">
                Todavía no hay servicios cargados. Corre{' '}
                <code className="font-mono">pnpm db:seed</code> para ver el catálogo de demostración
                de Colombia.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            )}
          </section>

          <section className="border-t border-border bg-surface-raised px-6 py-16 md:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-2xl text-text">¿Qué es el Índice de Fidelidad?</h2>
              <p className="mt-4 font-body text-text-muted">
                Después de vivir un servicio, quien lo contrató califica de −3 a +3 qué tan fiel fue
                a lo prometido. El promedio es el Índice de Fidelidad: convierte la honestidad en un
                dato que puedes ver antes de reservar.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
