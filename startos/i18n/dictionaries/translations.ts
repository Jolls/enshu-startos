import { LangDict } from './default'

// TODO: machine-drafted — have a native speaker review before release.
export default {
  es_ES: {
    0: '¡Iniciando Enshu!',
    1: 'Interfaz web',
    2: 'La interfaz web está lista',
    3: 'La interfaz web no está lista',
    4: 'Esperando a que PostgreSQL esté listo',
    5: 'PostgreSQL está listo',
    6: 'El revisor web y la interfaz de administración de Enshu',
  },
  de_DE: {
    0: 'Starte Enshu!',
    1: 'Weboberfläche',
    2: 'Die Weboberfläche ist bereit',
    3: 'Die Weboberfläche ist nicht bereit',
    4: 'Warte auf PostgreSQL',
    5: 'PostgreSQL ist bereit',
    6: 'Der Enshu-Webreviewer und die Admin-Oberfläche',
  },
  pl_PL: {
    0: 'Uruchamianie Enshu!',
    1: 'Interfejs webowy',
    2: 'Interfejs webowy jest gotowy',
    3: 'Interfejs webowy nie jest gotowy',
    4: 'Oczekiwanie na gotowość PostgreSQL',
    5: 'PostgreSQL jest gotowy',
    6: 'Webowy moduł powtórek i interfejs administracyjny Enshu',
  },
  fr_FR: {
    0: 'Démarrage de Enshu !',
    1: 'Interface web',
    2: "L'interface web est prête",
    3: "L'interface web n'est pas prête",
    4: 'En attente de PostgreSQL',
    5: 'PostgreSQL est prêt',
    6: "Le réviseur web et l'interface d'administration d'Enshu",
  },
} satisfies Record<string, LangDict>
